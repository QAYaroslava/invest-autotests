const InvestmentAPI = require('./investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");

describe('Closing market positions', () => {
    let api;
    let positionId;
    let status;
    let openPrice;
    const takeProfitBuy = 0.95;
    const stopLossBuy = 1.049;
    const takeProfitSell = 1.049;
    const stopLossSell = 0.95

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
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 2, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    const response = await api.openPendingLimitPosition(positionData);
    expect(response.status).toBe(200);

    // Проверяем, что позиция создана, но неактивна пока текущая цена не достигнет pendingLimitPrice
    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Прокидываем цену интрумента равную pendingLimitPrice
    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    // Проверяем, что позиция действительно открылась
    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price.`);

}, 15000);

it("should open pending stop position", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 1, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    const response = await api.openPendingStopPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Stop Position ${positionId} activated at the open price: ${openPrice}.`);

}, 15000);

it("should close pending limit position by take profit", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 2, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice,
        takeProfitType: 1,
        takeProfitValue: takeProfitSell,
        stopLossType: 1,
        stopLossValue: stopLossSell
    };

    const response = await api.openPendingLimitPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price.`);

    await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitSell);
    logger.info(`Instrument price set to Take Profit value: ${takeProfitSell}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);
    
    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(2); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
    logger.info(`Position ${positionId} closed by Take Profit.`);

}, 15000);

it("should close pending stop position by take profit", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 1, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice,
        takeProfitType: 1,
        takeProfitValue: takeProfitBuy,
        stopLossType: 1,
        stopLossValue: stopLossBuy
    };

    const response = await api.openPendingStopPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Stop Position ${positionId} activated at the open price: ${openPrice}.`);

    await api.setupInstrumentPrice("TEST2USDT.FTS", takeProfitBuy);
    logger.info(`Instrument price set to Take Profit value: ${takeProfitBuy}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);
    
    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(2); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
    logger.info(`Position ${positionId} closed by Take Profit.`);

}, 15000);

it("should close pending limit position by stop loss", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 2, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice,
        takeProfitType: 1,
        takeProfitValue: takeProfitSell,
        stopLossType: 1,
        stopLossValue: stopLossSell
    };

    const response = await api.openPendingLimitPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price: ${openPrice}.`);

    await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossSell);
    logger.info(`Instrument price set to Stop Loss value: ${stopLossSell}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);
    
    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(1); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
    logger.info(`Position ${positionId} closed by Stop Loss.`);

}, 15000);

it("should close pending stop position by stop loss", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 1, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice,
        takeProfitType: 1,
        takeProfitValue: takeProfitBuy,
        stopLossType: 1,
        stopLossValue: stopLossBuy
    };

    const response = await api.openPendingStopPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Stop Position ${positionId} activated at the open price: ${openPrice}.`);

    await api.setupInstrumentPrice("TEST2USDT.FTS", stopLossBuy);
    logger.info(`Instrument price set to Stop Loss value: ${stopLossBuy}`);
    
    // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);
    
    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(1); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
    logger.info(`Position ${positionId} closed by Stop Loss.`);

}, 15000);

it("should close pending limit position by stop out", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingLimitPrice = 0.95;
    const deviationPercentage = 0.16; // Stop Out
    const upperLimit = pendingLimitPrice * (1 + deviationPercentage);

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 2, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingLimitPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    const response = await api.openPendingLimitPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingLimitPrice);
    logger.info(`Instrument price set to: ${pendingLimitPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price: ${openPrice}.`);

    // Устанавливаем цену, которая превышает верхнюю границу
    await api.setupInstrumentPrice("TEST2USDT.FTS", upperLimit + 0.01);
    logger.info(`Instrument price set to: ${upperLimit + 0.01}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);

    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

    logger.info(`Position ${positionId} closed due to price deviation.`);

}, 15000);

it("should close pending stop position by stop out", async () => {
    await api.setupInstrumentPrice("TEST2USDT.FTS", 1);
    const pendingPrice = 0.95;
    const deviationPercentage = 0.16; // Stop Out
    const upperLimit = pendingPrice * (1 - deviationPercentage);

    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 5,
        direction: 1, // Undefined (0), Buy (1), Sell (2)
        targetPrice: pendingPrice
        // takeProfitType: 1,
        // takeProfitValue: takeProfitBuy,
        // stopLossType: 1,
        // stopLossValue: stopLossBuy
    };

    const response = await api.openPendingStopPosition(positionData);
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    status = response.data?.data?.position?.status;
    logger.info(`Position ID: ${positionId}`);
    logger.info(`Position status: ${status}`);
    expect(positionId).toBeDefined();
    expect(status).toBeDefined();
    expect(status).toBe(2);

    await new Promise(resolve => setTimeout(resolve, 3000));

    await api.setupInstrumentPrice("TEST2USDT.FTS", pendingPrice);
    logger.info(`Instrument price set to: ${pendingPrice}`);

    await new Promise(resolve => setTimeout(resolve, 4000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = getPositionResponse.data?.data?.position?.status;
    openPrice = getPositionResponse.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price: ${openPrice}.`);

    // Устанавливаем цену, которая превышает верхнюю границу
    await api.setupInstrumentPrice("TEST2USDT.FTS", upperLimit - 0.01);
    logger.info(`Instrument price set to: ${upperLimit - 0.01}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Вызываем запрос на получение информации о позиции
    const closedPositionResponse = await api.getPositionById(positionId);
    expect(closedPositionResponse.status).toBe(200);
    logger.info(`Position ${positionId} closed successfully.`);
    logger.info(`Position data: ${JSON.stringify(closedPositionResponse.data)}`);

    // Проверяем причину закрытия позиции
    const closeReason = closedPositionResponse.data?.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

    logger.info(`Position ${positionId} closed due to price deviation.`);

}, 15000);



})