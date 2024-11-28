const axios = require("axios");
const logger = require('../helpers/logger');
const {generateAuthToken} = require("../helpers/authTgToken");
const { getClient, closeAll } = require('../helpers/grpc-client-factory');

// Конфигурация API
const API_CONFIG = {
    baseURL: 'https://api-uat.simple-spot.biz/api/v1/tg_invest',
    endpoints: {
        openPosition: 'InvestAction/create-market-open-position',
        closePosition: 'InvestAction/close-active-position'
    }
};

// Класс для работы с API
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
                    clientClosePrice: clientClosePrice //TODO: что за clientClosePrice ?
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

describe('Investment API Tests', () => {
    let api;
    let positionId;
    // let investClient;
    // let helperClient;

    beforeAll(async () => {
        // investClient = await getClient('invest');
        // helperClient = await getClient('helper');
        const authTgToken = generateAuthToken();
        api = new InvestmentAPI(authTgToken);
        logger.info(`Generated token: ${authTgToken}`);
    });

    afterAll(() => {
        closeAll();
    });

    it("should open market position", async () => {
        // let quote = await helperClient.StringToDecimal({
        //     "Value": "1"
        // });
        // const makePriceRequest = {
        //     "Symbol": "TEST2USDT.FTS",
        //     "Ask": quote['Value'],
        //     "Bid": quote['Value'],
        //     "Last": quote['Value']
        // };
        // const makePrice = await investClient.MakePrice(makePriceRequest);

        const positionData = {
            symbol: "DOGEUSDT.FTS",
            amount: 2000,
            amountAssetId: "SMPL",
            multiplicator: 9,
            direction: 1,
            takeProfitType: 1,
            takeProfitValue: 0.4396455,
        };

        const response = await api.openMarketPosition(positionData);
        expect(response.status).toBe(200);

        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    });

    it("should close market position", async () => {
        // Добавляем явное ожидание для имитации реальных условий
        await new Promise(resolve => setTimeout(resolve, 3000));

        expect(positionId).toBeDefined();
        const response = await api.closeMarketPosition(positionId);
        expect(response.status).toBe(200);
    });
});