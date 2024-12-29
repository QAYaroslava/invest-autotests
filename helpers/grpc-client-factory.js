const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const logger = require('./logger');
const config = require('../config/grpc.config');
console.log(config);

class GrpcClientFactory {
    constructor() {
        this.clients = new Map();
        this.serviceDefinitions = new Map();
    }

    /**
     * Загружает proto файл и создает определение сервиса
     * @param {string} serviceName
     * @private
     */
    async loadProtoDefinition(serviceName) {
        try {
            const serviceConfig = config.services[serviceName];
            if (!serviceConfig) {
                throw new Error(`Service configuration not found for ${serviceName}`);
            }

            const packageDefinition = await protoLoader.load(
                serviceConfig.protoPath,
                config.defaultOptions
            );

            const definition = grpc.loadPackageDefinition(packageDefinition);
            this.serviceDefinitions.set(serviceName, {
                definition,
                config: serviceConfig
            });

            logger.info(`Proto definition loaded for ${serviceName}`);
        } catch (error) {
            logger.error(`Failed to load proto definition for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Создает клиент для определенного сервиса
     * @param {string} serviceName
     * @returns {Promise<Object>}
     */
    async createClient(serviceName) {
        if (!this.serviceDefinitions.has(serviceName)) {
            await this.loadProtoDefinition(serviceName);
        }

        const {definition, config: serviceConfig} = this.serviceDefinitions.get(serviceName);
        const packagePath = serviceConfig.package.split('.');
        let ServiceClient = definition;

        for (const part of packagePath) {
            ServiceClient = ServiceClient[part];
            if (!ServiceClient) {
                throw new Error(`Invalid package path: ${serviceConfig.package}`);
            }
        }

        ServiceClient = ServiceClient[serviceConfig.service];

        // Создаем клиент
        const client = new ServiceClient(
            `${serviceConfig.host}:${serviceConfig.port}`,
            grpc.credentials.createInsecure()
        );

        // Оборачиваем методы в Promise
        return new Proxy(client, {
            get: (target, prop) => {
                const original = target[prop];
                if (typeof original !== 'function') return original;

                return (request) => {
                    return new Promise((resolve, reject) => {
                        original.call(target, request, (error, response) => {
                            if (error) reject(error);
                            else resolve(response);
                        });
                    });
                };
            }
        });
    }

    /**
     * Оборачивает методы клиента в Promise с retry механизмом
     * @param {Object} client
     * @param {string} serviceName
     * @returns {Object}
     * @private
     */
    wrapClientMethods(client, serviceName) {
        const wrappedClient = {};

        // Получаем все методы сервиса
        const serviceMethods = Object.entries(Object.getPrototypeOf(client).__proto__)
            .filter(([key]) => typeof client[key] === 'function');

        for (const [methodName, originalMethod] of serviceMethods) {
            wrappedClient[methodName] = async (request) => {
                let lastError;
                const { retryAttempts, retryDelay } = config.defaultOptions;

                for (let attempt = 1; attempt <= retryAttempts; attempt++) {
                    try {
                        const response = await new Promise((resolve, reject) => {
                            client[methodName](request, (error, response) => {
                                if (error) reject(error);
                                else resolve(response);
                            });
                        });

                        logger.info(`${serviceName}.${methodName} call successful`);
                        return response;
                    } catch (error) {
                        lastError = error;
                        logger.error(`${serviceName}.${methodName} call failed (attempt ${attempt}):`, error);

                        if (attempt < retryAttempts) {
                            logger.info(`Retrying in ${retryDelay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, retryDelay));
                        }
                    }
                }

                throw lastError;
            };
        }

        return wrappedClient;
    }

    /**
     * Получает клиент для сервиса
     * @param {string} serviceName
     * @returns {Promise<Object>}
     */
    async getClient(serviceName) {
        if (!this.clients.has(serviceName)) {
            const client = await this.createClient(serviceName);
            this.clients.set(serviceName, client);
        }
        return this.clients.get(serviceName);
    }

    /**
     * Закрывает все соединения
     */
    closeAll() {
        for (const [serviceName, client] of this.clients.entries()) {
            if (client.close) {
                client.close();
                logger.info(`Closed connection for ${serviceName}`);
            }
        }
        this.clients.clear();
    }
}

// Создаем синглтон фабрики
const factory = new GrpcClientFactory();

module.exports = {
    getClient: (serviceName) => factory.getClient(serviceName),
    closeAll: () => factory.closeAll()
};