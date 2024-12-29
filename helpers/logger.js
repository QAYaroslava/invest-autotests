// helpers/logger.js
const winston = require('winston');
const path = require('path');

// Формат для консольного вывода
const consoleFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Добавляем метаданные, если они есть
        if (Object.keys(metadata).length > 0) {
            if (metadata.data) {
            msg += '\nRequest:';
            if (metadata.data.url) {
                msg += `\n  URL: ${metadata.data.url}`;
            }
            if (metadata.data.data) {
                msg += '\n  Payload:\n';
                msg += `${JSON.stringify(metadata.data.data, null, 4)}`.split('\n').map(line => '    ' + line).join('\n');
            }
            msg += '\nResponse:\n';
            msg += `${JSON.stringify(metadata.response, null, 4)}`.split('\n').map(line => '    ' + line).join('\n');
        } else {
                msg += JSON.stringify(metadata, null, 2);
            }
        }

        return msg;
    })
);

// Формат для файлового вывода (без цветов)
const fileFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
);

class Logger {
    constructor() {
        const logsDir = path.join(process.cwd(), 'logs');

        // Создаем логгер
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            transports: [
                // Логирование в файлы
                new winston.transports.File({
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    format: fileFormat,
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: path.join(logsDir, 'combined.log'),
                    format: fileFormat,
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                // Консольный вывод
                new winston.transports.Console({
                    format: consoleFormat
                })
            ],
            // Не падаем при ошибках логирования
            exitOnError: false
        });

        // Добавляем обработчик необработанных ошибок
        this.logger.on('error', (error) => {
            console.error('Logger error:', error);
        });
    }

    /**
     * Добавляет контекст к логам
     * @param {Object} metadata
     * @returns {Object} - Logger instance
     */
    withMetadata(metadata) {
        return {
            debug: (message) => this.debug(message, metadata),
            info: (message) => this.info(message, metadata),
            warn: (message) => this.warn(message, metadata),
            error: (message, error) => this.error(message, { ...metadata, error })
        };
    }

    /**
     * Форматирует ошибку для логирования
     * @param {Error} error
     * @returns {Object}
     * @private
     */
    _formatError(error) {
        if (!error) return {};

        return {
            message: error.message,
            stack: error.stack,
            ...error
        };
    }

    /**
     * Debug level logging
     * @param {string} message
     * @param {Object} metadata
     */
    debug(message, metadata = {}) {
        this.logger.debug(message, metadata);
    }

    /**
     * Info level logging
     * @param {string} message
     * @param {Object} metadata
     */
    info(message, metadata = {}) {
        this.logger.info(message, metadata);
    }

    /**
     * Warning level logging
     * @param {string} message
     * @param {Object} metadata
     */
    warn(message, metadata = {}) {
        this.logger.warn(message, metadata);
    }

    /**
     * Error level logging
     * @param {string} message
     * @param {Error|null} error
     * @param {Object} metadata
     */
    error(message, error = null, metadata = {}) {
        const errorData = this._formatError(error);
        this.logger.error(message, { ...metadata, error: errorData });
    }

    /**
     * Логирует начало теста
     * @param {string} testName
     * @param {Object} metadata
     */
    startTest(testName, metadata = {}) {
        this.info(`Starting test: ${testName}`, {
            event: 'test_start',
            testName,
            ...metadata
        });
    }

    /**
     * Логирует окончание теста
     * @param {string} testName
     * @param {Object} result
     */
    endTest(testName, result = {}) {
        this.info(`Completed test: ${testName}`, {
            event: 'test_end',
            testName,
            ...result
        });
    }

    /**
     * Логирует gRPC запрос
     * @param {string} method
     * @param {Object} request
     */
    logGrpcRequest(method, request) {
        this.debug('gRPC request', {
            type: 'grpc_request',
            method,
            request
        });
    }

    /**
     * Логирует gRPC ответ
     * @param {string} method
     * @param {Object} response
     */
    logGrpcResponse(method, response) {
        this.debug('gRPC response', {
            type: 'grpc_response',
            method,
            response
        });
    }
}

// Создаем синглтон логгера
const logger = new Logger();

module.exports = logger;