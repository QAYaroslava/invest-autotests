const axios = require("axios");
const logger = require('../helpers/logger');
const { getClient, closeAll } = require('../helpers/grpc-client-factory');

const API_CONFIG = {
    baseURL: 'https://api-uat.simple-spot.biz/api/v1/tg_invest',
    endpoints: {
        openPosition: 'InvestAction/create-market-open-position',
        closePosition: 'InvestAction/close-active-position'
    }
};

class InvestmentAPI {
    constructor(authToken) {
        this.axiosInstance = axios.create({
            baseURL: API_CONFIG.baseURL,
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            validateStatus: status => status >= 200 && status < 500
        });
        this.investClient = null;
        this.helperClient = null;
    }

    async _initializeClients() {
        this.investClient = await getClient('invest');
        this.helperClient = await getClient('helper');
    }

    closeGRPCConnections() {
        if (this.investClient || this.helperClient){
            closeAll();
            this.investClient = null;
            this.helperClient = null;
        }
    }

    async setupInstrumentPrice(symbol="TEST2USDT.FTS", price=1) {
        if (!this.investClient || !this.helperClient) {
            await this._initializeClients();
        }

        const quote = await this.helperClient.StringToDecimal({
            "Value": `${price}`
        });

        const makePriceRequest = {
            "Symbol": symbol,
            "Ask": quote['Value'],
            "Bid": quote['Value'],
            "Last": quote['Value']
        };

        return await this.investClient.MakePrice(makePriceRequest);
    }

    async openMarketPosition(positionData) {
        try {
            const response = await this.axiosInstance.post(
                API_CONFIG.endpoints.openPosition,
                positionData
            );
            logger.info(`Creation of position:`,
            {
                data: {
                    url: API_CONFIG.endpoints.openPosition,
                    data: positionData
                },
                response: response.data
            });
            return response;
        } catch (error) {
            logger.error(`Failed to open position: ${error.response?.data || error.message}`);
            throw error;
        }
    }

    async closeMarketPosition(positionId, clientClosePrice = 0) {
        try {
            const response = await this.axiosInstance.post(
                API_CONFIG.endpoints.closePosition, {
                    positionId: positionId,
                    clientClosePrice: clientClosePrice
                });
            logger.info('Close of position:',
            {
                data: {
                    url: API_CONFIG.endpoints.openPosition,
                    data: { positionId, clientClosePrice }
                },
                response: response.data
            });
            return response;
        } catch (error) {
            logger.error(`Failed to close position: ${error.response?.data || error.message}`);
            throw error;
        }
    }
}

module.exports = InvestmentAPI;