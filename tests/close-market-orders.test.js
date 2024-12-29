const InvestmentAPI = require('../apis/investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");
const CONSTANTS = require('../config/constants');

describe('Closing market positions', () => {
    let api;
    let positionId;
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
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.BUY,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.MARKET_CLOSE);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should open market sell position", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.SELL,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.MARKET_CLOSE);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market buy position by take profit", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        // Открываем позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.BUY,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
    
        logger.info(`Position ${positionId} closed by Take Profit.`);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market sell position by take profit", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    
        // Открываем позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.SELL,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
    
        logger.info(`Position ${positionId} closed by Take Profit.`);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market buy position by stop loss", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

        // Открываем позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.BUY,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.STOP_LOSS);

        logger.info(`Position ${positionId} closed by Stop Loss.`);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market sell position by stop loss", async () => {
        // Прокидываем начальную цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1);

        // Открываем позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.BUY,
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
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.STOP_LOSS);

        logger.info(`Position ${positionId} closed by Stop Loss.`);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market sell position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const instrumentStopOut = 0.1 // Stop Out

        // Устанавливаем начальную цену
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        // Открываем buy позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.SELL,
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);

        const position = getPositionResponse.data?.data?.position;
        const { openPrice, volume, multiplicator, openFee, rollOver, closeFee } = position;

        // Рассчитываем stopOutPl и StopOutPrice
        const stopOutPl = -volume / multiplicator * (1 - instrumentStopOut);
        const buySell = position.direction === CONSTANTS.DIRECTION.BUY ? 1 : -1; // 1 for buy, -1 for sell
        const StopOutPrice = parseFloat(
            (openPrice * (1 + buySell * (stopOutPl + openFee - rollOver + closeFee) / volume)).toFixed(4)
        );

        logger.info(`Calculated StopOutPrice: ${StopOutPrice}`);
        logger.info(`Calculated StopOutPrice (formatted): ${StopOutPrice.toFixed(4)}`);

        // Прокидываем новую цену инструмента
        await api.setupInstrumentPrice("TEST2USDT.FTS", StopOutPrice);
        logger.info(`Instrument price set to StopOutPrice: ${StopOutPrice}`);

        await new Promise(resolve => setTimeout(resolve, 4000));

        const getClosedPositionResponse = await api.getPositionById(positionId);
        expect(getClosedPositionResponse.status).toBe(200);

        // Проверяем причину закрытия позиции
        const closeReason = getClosedPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.LIQUIDATION);

        logger.info(`Position ${positionId} closed due to price deviation.`);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market buy position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const instrumentStopOut = 0.1 // Stop Out

        // Устанавливаем начальную цену
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        // Открываем buy позицию
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.BUY,
        };

        const openResponse = await api.openMarketPosition(positionData);
        expect(openResponse.status).toBe(200);
        await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

        positionId = openResponse.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);
        expect(positionId).toBeDefined();

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);

        const position = getPositionResponse.data?.data?.position;
        const { openPrice, volume, multiplicator, openFee, rollOver, closeFee } = position;

        // Рассчитываем stopOutPl и StopOutPrice
        const stopOutPl = -volume / multiplicator * (1 - instrumentStopOut);
        const buySell = position.direction === CONSTANTS.DIRECTION.BUY ? 1 : -1; // 1 for buy, -1 for sell
        const StopOutPrice = parseFloat(
            (openPrice * (1 + buySell * (stopOutPl + openFee - rollOver + closeFee) / volume)).toFixed(4)
        );

        logger.info(`Calculated StopOutPrice: ${StopOutPrice}`);
        logger.info(`Calculated StopOutPrice (formatted): ${StopOutPrice.toFixed(4)}`);

        await api.setupInstrumentPrice("TEST2USDT.FTS", StopOutPrice);
        logger.info(`Instrument price set to StopOutPrice: ${StopOutPrice}`);

        await new Promise(resolve => setTimeout(resolve, 4000));

        const getClosedPositionResponse = await api.getPositionById(positionId);
        expect(getClosedPositionResponse.status).toBe(200);

        // Проверяем причину закрытия позиции
        const closeReason = getClosedPositionResponse.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(CONSTANTS.CLOSE_REASON.LIQUIDATION);

        logger.info(`Position ${positionId} closed due to price deviation.`);
    }, CONSTANTS.TIMEOUTS.TEST);
})
