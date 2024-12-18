const InvestmentAPI = require('./investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");

describe('Investment API Tests', () => {
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

    it("should open market position", async () => {
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
        const closeReason = response.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(3); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    });

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
        await api.setupInstrumentPrice("TEST2USDT.FTS", );
        logger.info(`Instrument price set to Take Profit value: ${takeProfitBuy}`);
    
        // Таймаут, чтоб позиция успела автоматически закрыться и перейти в статус Closed
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Вызываем запрос на получение информации о позиции
        const getPositionResponse = await api.getPositionById(positionId);
        expect(getPositionResponse.status).toBe(200);
        logger.info(`Position ${positionId} closed successfully.`);
        logger.info(`Position data: ${JSON.stringify(getPositionResponse.data)}`);
    
        // Проверяем причину закрытия позиции
        const closeReason = getPositionResponse.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);
        expect(closeReason).toBe(2); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)
    
        logger.info(`Position ${positionId} closed by Take Profit.`);
    }, 15000);

it.only("should close market buy position by stop loss", async () => {
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
    const closeReason = getPositionResponse.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(1); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

    logger.info(`Position ${positionId} closed by Stop Loss.`);
}, 15000);

it("should close market buy position automatically if price deviates by +10%", async () => {
    const initialPrice = 1; // Начальная цена инструмента
    const deviationPercentage = 0.1; // 10% Stop Out
    const upperLimit = initialPrice * (1 + deviationPercentage);

    // Устанавливаем начальную цену
    await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

    // Открываем позицию
    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 10,
        direction: 1,
        takeProfitType: 1,
        takeProfitValue: initialPrice * 1.05,
    };

    const openResponse = await api.openMarketPosition(positionData);
    expect(openResponse.status).toBe(200);

    positionId = openResponse.data?.data?.position?.id;
    logger.info(`Position ID: ${positionId}`);
    expect(positionId).toBeDefined();

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
    const closeReason = getPositionResponse.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

    logger.info(`Position ${positionId} closed due to price deviation.`);
});

it("should close market buy position automatically if price deviates by -10%", async () => {
    const initialPrice = 1; // Начальная цена инструмента
    const deviationPercentage = 0.1; // 10% Stop Out
    const lowerLimit = initialPrice * (1 - deviationPercentage);

    // Устанавливаем начальную цену
    await api.setupInstrumentPrice("TEST2USDT.FTS", initialPrice);

    // Открываем позицию
    const positionData = {
        symbol: "TEST2USDT.FTS",
        amount: 100,
        amountAssetId: "SMPL",
        multiplicator: 10,
        direction: 1,
        takeProfitType: 1,
        takeProfitValue: initialPrice * 1.05,
    };

    const openResponse = await api.openMarketPosition(positionData);
    expect(openResponse.status).toBe(200);

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
    const closeReason = getPositionResponse.data?.position?.closeReason;
    logger.info(`Position close reason: ${closeReason}`);
    expect(closeReason).toBe(4); // Undefined (0), StopLoss (1), TakeProfit (2), MarketClose (3), Liquidation (4)

    logger.info(`Position ${positionId} closed due to price deviation.`);
});

it("should open pending limit position", async () => {
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

    await new Promise(resolve => setTimeout(resolve, 3000));

    const getPositionResponse = await api.getPositionById(positionId);
    expect(getPositionResponse.status).toBe(200);

    status = response.data?.data?.position?.status;
    openPrice = response.data?.data?.position?.openPrice

    logger.info(`Position status: ${status}`);
    logger.info(`Position open price: ${openPrice}`);

    expect(status).toBe(4);
    expect(openPrice).toBe(pendingLimitPrice);

    logger.info(`Pending Limit Position ${positionId} activated at the open price.`);


});

})
