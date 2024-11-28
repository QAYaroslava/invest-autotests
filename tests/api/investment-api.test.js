const InvestmentAPI = require('./investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");

describe('Investment API Tests', () => {
    let api;
    let positionId;

    beforeAll(async () => {
        const authTgToken = generateAuthToken();
        api = new InvestmentAPI(authTgToken);
        logger.info(`Generated token: ${authTgToken}`);
    });

    afterAll(() => {
        api.closeGRPCConnections();
    });

    it("should open market position", async () => {
        // await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

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