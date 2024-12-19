const InvestmentAPI = require('./investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");

describe('Closing market positions', () => {
    let api;
    let positionId;
    let status;
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

    it("should open market buy position", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 5,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            // takeProfitType: 1,
            // takeProfitValue: takeProfitBuy,
            // stopLossType: 1,
            // stopLossValue: stopLossBuy
        };

        const response = await api.openMarketPosition(positionData);
        expect(response.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    });

    it("should manually close market buy position", async () => {
        // Добавляем явное ожидание для имитации реальных условий
        await new Promise(resolve => setTimeout(resolve, 4000));

        expect(positionId).toBeDefined();
        const response = await api.closeMarketPosition(positionId);
        expect(response.status).toBe(200);
        const closeReason = response.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(3); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    }, 15000);

    it("should open market sell position", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 5,
            direction: 2, // Undefined (0), Buy (1), Sell (2)
            // takeProfitType: 1,
            // takeProfitValue: takeProfitBuy,
            // stopLossType: 1,
            // stopLossValue: stopLossBuy
        };

        const response = await api.openMarketPosition(positionData);
        expect(response.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    });

    it("should manually close market sell position", async () => {
        // Добавляем явное ожидание для имитации реальных условий
        await new Promise(resolve => setTimeout(resolve, 4000));

        expect(positionId).toBeDefined();
        const response = await api.closeMarketPosition(positionId);
        expect(response.status).toBe(200);
        const closeReason = response.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(3); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    }, 15000);

    it("should close market buy position by take profit", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        // Открываем позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 10,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitBuy,
            stopLossType: 1,
            stopLossValue: stopLossBuy
        };
    
        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    
        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Устанавливаем цену закрытия позиции по Take Profit
        await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitBuy);
        logger.info(`Instrument price set to Take Profit value: ${takeProfitBuy}`);
    
        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);
    
        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(2); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
        logger.info(`Position ${positionId} closed by Take Profit.`);
    }, 15000);

    it("should close market sell position by take profit", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        // Открываем позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 100,
            amountAssetId: "SMPL",
            multiplicator: 10,
            direction: 2, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitSell,
            stopLossType: 1,
            stopLossValue: stopLossSell
        };
    
        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();
    
        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Устанавливаем цену закрытия позиции по Take Profit
        await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitSell);
        logger.info(`Instrument price set to Take Profit value: ${takeProfitSell}`);
    
        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);
    
        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(2); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
        logger.info(`Position ${positionId} closed by Take Profit.`);
    }, 15000);

    it("should close market buy position by stop loss", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

        // Открываем позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 10,
            amountAssetId: "SMPL",
            multiplicator: 10,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitBuy,
            stopLossType: 1,
            stopLossValue: stopLossBuy
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

    
        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Устанавливаем цену закрытия позиции по Stop Loss
        await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossBuy);
        logger.info(`Instrument price set to Stop Loss value: ${stopLossBuy}`);

        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);

        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(1); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

        logger.info(`Position ${positionId} closed by Stop Loss.`);
    }, 15000);

    it("should close market sell position by stop loss", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

        // Открываем позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 10,
            amountAssetId: "SMPL",
            multiplicator: 10,
            direction: 1, // Undefined (0), Buy (1), Sell (2)
            takeProfitType: 1,
            takeProfitValue: takeProfitSell,
            stopLossType: 1,
            stopLossValue: stopLossSell
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

    
        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Устанавливаем цену закрытия позиции по Stop Loss
        await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossSell);
        logger.info(`Instrument price set to Stop Loss value: ${stopLossSell}`);

        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);

        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(1); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

        logger.info(`Position ${positionId} closed by Stop Loss.`);
    }, 15000);

    it("should close market sell position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const deviationPercentage = 0.16; // Stop Out
        const upperLimit = initialPrice * (1 + deviationPercentage);

        // Устанавливаем начальную цену
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        // Открываем sell позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 10,
            amountAssetId: "SMPL",
            multiplicator: 5,
            direction: 2,
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Устанавливаем цену, которая превышает верхнюю границу
        await api.setupInstrumentPrice("TEST2USDT.FTS", upperLimit + 0.01);
        logger.info(`Instrument price set to: ${upperLimit + 0.01}`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);

        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

        logger.info(`Position ${positionId} closed due to price deviation.`);
    }, 15000);

    it("should close market buy position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const deviationPercentage = 0.17; // Stop Out
        const lowerLimit = initialPrice * (1 - deviationPercentage);

        // Устанавливаем начальную цену
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        // Открываем buy позицию
        const positionData = {
            symbol: "TEST2USDT.FTS",
            amount: 10,
            amountAssetId: "SMPL",
            multiplicator: 10,
            direction: 1,
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        // Устанавливаем цену меньше нижней границы
        await api.setupInstrumentPrice("TEST2USDT.FTS", lowerLimit - 0.01);
        logger.info(`Instrument price set to: ${lowerLimit - 0.01}`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);

        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

        logger.info(`Position ${positionId} closed due to price deviation.`);
    }, 15000);
})
