const InvestmentAPI = require('../apis/investment-api');
const logger = require('../helpers/logger');
const { generateAuthToken } = require("../helpers/authTgToken");
const CONSTANTS = require('../config/constants');

describe('Checking rollover', () => {
    let api;
    let positionId;
    const initialPrice = 1;
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
        await api.setupInstrumentPrice(CONSTANTS.SYMBOL, 1)

        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.BUY,
            takeProfitType: CONSTANTS.TAKE_PROFIT_TYPE.PRICE,
            takeProfitValue: takeProfitBuy,
            stopLossType: CONSTANTS.STOP_LOSS_TYPE.PRICE,
            stopLossValue: stopLossBuy
        };

        positionId = await api.openAndVerifyMarketPosition(positionData, initialPrice, CONSTANTS.POSITION_STATUS.OPENED);

        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Получаем данные про позицию и проверяем, что роловер равен нулю сразу после открытия позиции
        await api.verifyRollover(positionId, 0);

        // Прокидываем новый ролловер
        await api.recalculateRollover(positionId);
        logger.info(`Rollover recalculated for position ID: ${positionId}`);

        // Таймаут, чтобы ролловер успел начислиться
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Получаем данные про позицию повторно и проверяем, что значение роловера изменилось на 0.5(шаг роловера)
        await api.verifyRollover(positionId, rolloverIncrement);
    }, CONSTANTS.TIMEOUTS.TEST);

    it("should open market sell position and calculate rollover", async () => {
        await api.setupInstrumentPrice(CONSTANTS.SYMBOL, 1)
    
        const positionData = {
            symbol: CONSTANTS.SYMBOL,
            amount: 100,
            amountAssetId: CONSTANTS.ASSET_ID,
            multiplicator: 5,
            direction: CONSTANTS.DIRECTION.SELL,
            takeProfitType: 1,
            takeProfitValue: takeProfitSell,
            stopLossType: 1,
            stopLossValue: stopLossSell
        };
    
        positionId = await api.openAndVerifyMarketPosition(positionData, initialPrice, CONSTANTS.POSITION_STATUS.OPENED);
    
        // Таймаут для того, чтобы позиция успела перейти из статуса Opening в Opened
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));
    
        // Получаем данные про позицию и проверяем, что роловер равен нулю сразу после открытия позиции
        await api.verifyRollover(positionId, 0);

        // Прокидываем новый ролловер
        await api.recalculateRollover(positionId);
        logger.info(`Rollover recalculated for position ID: ${positionId}`);

        // Таймаут, чтобы ролловер успел начислиться
        await new Promise(resolve => setTimeout(resolve, CONSTANTS.TIMEOUTS.DEFAULT));

        // Получаем данные про позицию повторно и проверяем, что значение роловера изменилось на 0.5(шаг роловера)
        await api.verifyRollover(positionId, rolloverIncrement);
    }, CONSTANTS.TIMEOUTS.TEST);
    
    });
