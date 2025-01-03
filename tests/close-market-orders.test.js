const InvestmentAPI = require('../apis/investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");
const CONSTANTS = require('../config/constants');
const { timeout } = require('../config/environment');

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
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.BUY,
            // takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            // takeProfitValue: takeProfitBuy,
            // stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            // stopLossValue: stopLossBuy
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);
    });

    it("should manually close market buy position", async () => {
        // Добавляем явное ожидание для имитации реальных условий
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        expect(positionId).toBeDefined();
        await api.closeAndVerifyMarketPosition(positionId, CONSTANTS.CLOSE_REASON.MARKET_CLOSE);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should open market sell position", async () => {
        await api.setupInstrumentPrice("TEST2USDT.FTS", 1)

        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.SELL,
            // takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            // takeProfitValue: takeProfitBuy,
            // stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            // stopLossValue: stopLossBuy
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);
    });

    it("should manually close market sell position", async () => {
        // Добавляем явное ожидание для имитации реальных условий
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        expect(positionId).toBeDefined();
        await api.closeAndVerifyMarketPosition(positionId, CONSTANTS.CLOSE_REASON.MARKET_CLOSE);
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
            takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            takeProfitValue: takeProfitBuy,
            stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            stopLossValue: stopLossBuy
        };
    
        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);
    
        // Устанавливаем цену закрытия позиции по Take Profit
        await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitBuy);
        logger.info(`Instrument price set to Take Profit value: ${takeProfitBuy}`);
    
        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
    
        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
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
            takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            takeProfitValue: takeProfitSell,
            stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            stopLossValue: stopLossSell
        };
    
        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);
    
        // Устанавливаем цену закрытия позиции по Take Profit
        await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitSell);
        logger.info(`Instrument price set to Take Profit value: ${takeProfitSell}`);
    
        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
    
        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
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
            takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            takeProfitValue: takeProfitBuy,
            stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            stopLossValue: stopLossBuy
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);

        // Устанавливаем цену закрытия позиции по Stop Loss
        await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossBuy);
        logger.info(`Instrument price set to Stop Loss value: ${stopLossBuy}`);

        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.STOP_LOSS);
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
            takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            takeProfitValue: takeProfitSell,
            stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            stopLossValue: stopLossSell
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, 1, CONSTANTS.POSITION_STATUS.OPENED);

        // Устанавливаем цену закрытия позиции по Stop Loss
        await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossSell);
        logger.info(`Instrument price set to Stop Loss value: ${stopLossSell}`);

        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.STOP_LOSS);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market sell position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const instrumentStopOut = 0.1 // Stop Out

        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.SELL,
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, initialPrice, CONSTANTS.POSITION_STATUS.OPENED);

        const stopOutPrice = await api.calculateAndSetStopOutPrice(positionId, instrumentStopOut);
        logger.info(`Calculated and set StopOutPrice: ${stopOutPrice}`);

        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.LIQUIDATION);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should close market buy position automatically if price deviates by Stop Out", async () => {
        const initialPrice = 1; // Начальная цена инструмента
        const instrumentStopOut = 0.1 // Stop Out

        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 10,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 10,
            direction: CONSTANTS.DIRECTION.BUY,
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, initialPrice, CONSTANTS.POSITION_STATUS.OPENED);

        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Calculate and set StopOut price using the new method
        const stopOutPrice = await api.calculateAndSetStopOutPrice(positionId, instrumentStopOut);
        logger.info(`Calculated and set StopOutPrice: ${stopOutPrice}`);

        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
        // Вызываем запрос на получение информации о позиции и проверяем причину закрытия позиции
        await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.LIQUIDATION);
    }, CONSTANTS.TIMEOUTS.TEST);
})
