const InvestmentAPI = require('./investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");

describe('Checking rollover', () => {
    let api;
    let positionId;
    const rolloverIncrement = 0.5;
    const takeProfitBuy = 1.049;
    const stopLossBuy = 0.95;
    const takeProfitSell = 0.95;
    const stopLossSell = 1.049;

    beforeAll(async () => {
        const authTgToken = generateAuthToken();
        api = new InvestmentAPI(authTgToken);
        logger.info(`Generated token: ${authTgToken}`);
    });

    afterAll(() => {
        api.closeGRPCConnections();
    });

    it("should open market buy position and calculate rollover", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 5,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitBuy,
            stopLossType: 1,
            stopLossValue: stopLossBuy
        };

        const response = await api.openMarketPosition(positionData);
        expect(response.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Получаем данные про позицию
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);

        const initialPositionData = getPositionResponse.data?.data?.position;

        // Тянем с респонса роловер и проверяем, что он равен нулю сразу после открытия позиции
        const initialRollover = initialPositionData?.rollOver;
        logger.info(`Initial rollover: ${initialRollover}`);
        logger.info(`Position data: ${JSON.stringify(initialPositionData.data)}`);
        expect(initialRollover).toBe(0);

        // Прокидываем новый ролловер
        await api.recalculateRollover(positionId);

        // Таймаут, чтобы ролловер успел начислиться
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Получаем данные про позицию повторно
        const updatedPositionResponse = await api.getPositionById(positionId);
        expect(updatedPositionResponse.status).toBe(200);

        const updatedPositionData = updatedPositionResponse.data?.data?.position;
        logger.info(`Position data: ${JSON.stringify(updatedPositionData.data)}`);

        // Снова тянем роловер и проверяем, что его значение изменилось на 0.5(шаг роловера)
        const updatedRollover = updatedPositionData?.rollOver;
        logger.info(`Updated rollover: ${updatedRollover}`);
        expect(updatedRollover).toBe(initialRollover + rolloverIncrement);

        }, 15000);

    it("should open market sell position and calculate rollover", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)
    
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 5,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitSell,
            stopLossType: 1,
            stopLossValue: stopLossSell
        };
    
        const response = await api.openMarketPosition(positionData);
        expect(response.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)
    
        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    
        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Получаем данные про позицию
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
    
        const initialPositionData = getPositionResponse.data?.data?.position;
    
        // Тянем с респонса роловер и проверяем, что он равен нулю сразу после открытия позиции
        const initialRollover = initialPositionData?.rollOver;
        logger.info(`Initial rollover: ${initialRollover}`);
        logger.info(`Position data: ${JSON.stringify(initialPositionData.data)}`);
        expect(initialRollover).toBe(0);
    
        // Прокидываем новый ролловер
        await api.recalculateRollover(positionId);
    
        // Таймаут, чтобы ролловер успел начислиться
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Получаем данные про позицию повторно
        const updatedPositionResponse = await api.getPositionById(positionId);
        expect(updatedPositionResponse.status).toBe(200);
    
        const updatedPositionData = updatedPositionResponse.data?.data?.position;
        logger.info(`Position data: ${JSON.stringify(updatedPositionData.data)}`);
    
        // Снова тянем роловер и проверяем, что его значение изменилось на 0.5(шаг роловера)
        const updatedRollover = updatedPositionData?.rollOver;
        logger.info(`Updated rollover: ${updatedRollover}`);
        expect(updatedRollover).toBe(initialRollover + rolloverIncrement);
    
        }, 15000);
    
    });
