const InvestmentAPI = require('../apis/investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");
const CONSTANTS = require('../config/constants');

describe('Closing market positions', () => {
    let api;
    let positionId;
    let status;
    let openPrice;
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

it("should open pending limit position", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.SELL,
        targetPrice: pendingLimitPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    // Открываем pending позицию и проверяем, что она неактивна пока текущая цена не достигнет pendingLimitPrice
    const positionId = await api.openAndVerifyPendingLimitPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

    // Прокидываем цену инструмента равную pendingLimitPrice
    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

    // Проверяем, что позиция действительно открылась с установленной ценой
    await api.verifyOpenedPosition(positionId, pendingLimitPrice);
}, CONSTANTS.TIMEOUTS.TEST);

it("should open pending stop position", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingStopPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.BUY,
        targetPrice: pendingStopPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    const positionId = await api.openAndVerifyPendingStopPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingStopPrice);
    logger.info(`Instrument price set to: ${pendingStopPrice}`);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

    await api.verifyOpenedPosition(positionId, pendingStopPrice);
}, CONSTANTS.TIMEOUTS.TEST);

it("should close pending limit position by take profit", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.SELL,
        targetPrice: pendingLimitPrice,
        takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        takeProfitValue: takeProfitSell,
        stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        stopLossValue: stopLossSell
    };

    const positionId = await api.openAndVerifyPendingLimitPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    await api.verifyOpenedPosition(positionId, pendingLimitPrice);

    await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitSell);
    logger.info(`Instrument price set to Take Profit value: ${takeProfitSell}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции и проверяем причину закрытия
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
    }, CONSTANTS.TIMEOUTS.TEST);

it("should close pending stop position by take profit", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingStopPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.BUY,
        targetPrice: pendingStopPrice,
        takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        takeProfitValue: takeProfitBuy,
        stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        stopLossValue: stopLossBuy
    };

    const positionId = await api.openAndVerifyPendingStopPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingStopPrice);
    logger.info(`Instrument price set to: ${pendingStopPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    await api.verifyOpenedPosition(positionId, pendingStopPrice);

    await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitBuy);
    logger.info(`Instrument price set to Take Profit value: ${takeProfitBuy}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции и проверяем причину закрытия
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.TAKE_PROFIT);
    }, CONSTANTS.TIMEOUTS.TEST);

it("should close pending limit position by stop loss", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.SELL,
        targetPrice: pendingLimitPrice,
        takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        takeProfitValue: takeProfitSell,
        stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        stopLossValue: stopLossSell
    };

    const positionId = await api.openAndVerifyPendingLimitPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    await api.verifyOpenedPosition(positionId, pendingLimitPrice);

    await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossSell);
    logger.info(`Instrument price set to Stop Loss value: ${stopLossSell}`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.STOP_LOSS);
    }, CONSTANTS.TIMEOUTS.TEST);

it("should close pending stop position by stop loss", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingStopPrice = 0.95;

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.BUY,
        targetPrice: pendingStopPrice,
        takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        takeProfitValue: takeProfitBuy,
        stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        stopLossValue: stopLossBuy
    };

    const positionId = await api.openAndVerifyPendingStopPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingStopPrice);
    logger.info(`Instrument price set to: ${pendingStopPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    await api.verifyOpenedPosition(positionId, pendingStopPrice);

    await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossBuy);
    logger.info(`Instrument price set to Stop Loss value: ${stopLossBuy}`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.STOP_LOSS);
    }, CONSTANTS.TIMEOUTS.TEST);

it.only("should close pending limit position by stop out", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;
    const instrumentStopOut = 0.1 // Stop Out

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.SELL,
        targetPrice: pendingLimitPrice,
        // takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        // takeProfitValue: takeProfitSell,
        // stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        // stopLossValue: stopLossSell
    };

    const positionId = await api.openAndVerifyPendingLimitPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const stopOutPrice = await api.calculateAndSetStopOutPrice(positionId, instrumentStopOut);
    logger.info(`Calculated and set StopOutPrice: ${stopOutPrice}`);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.LIQUIDATION);
    }, CONSTANTS.TIMEOUTS.TEST);

it("should close pending stop position by stop out", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingStopPrice = 0.95;
    const instrumentStopOut = 0.1 // Stop Out

    const positionData = {
        symbol: CONSTANTS.SYMBOL,
        amount: 100,
        amountAssetId: CONSTANTS.ASSET_ID,
        multiplicator: 5,
        direction: CONSTANTS.DIRECTION.BUY,
        targetPrice: pendingStopPrice,
        // takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
        // stopLossValue: stopLossBuy
    };

    const positionId = await api.openAndVerifyPendingStopPosition(positionData);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingStopPrice);
    logger.info(`Instrument price set to: ${pendingStopPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const stopOutPrice = await api.calculateAndSetStopOutPrice(positionId, instrumentStopOut);
    logger.info(`Calculated and set StopOutPrice: ${stopOutPrice}`);

    await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
    await api.verifyPositionCloseReason(positionId, CONSTANTS.CLOSE_REASON.LIQUIDATION);
    }, CONSTANTS.TIMEOUTS.TEST);

})