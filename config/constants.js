//TODO: add takeprofit and stoploss types
const CONSTANTS = {
    SYMBOL: "TEST2USDT.FTS",
    ASSET_ID: "SMPL",
    DIRECTION: {
        UNDEFINED: 0,
        BUY: 1,
        SELL: 2
    },
    POSITION_STATUS: {
        UNDEFINED: 0,
        DRAFT: 1,
        PENDING: 2,
        OPENING: 3,
        OPENED: 4,
        CLOSING: 5,
        CLOSED: 6,
        CANCELLING: 7,
        CANCELLED: 8,
        DRAFT_CANCELLED: 9
    },
    CLOSE_REASON: {
        UNDEFINED: 0,
        STOP_LOSS: 1,
        TAKE_PROFIT: 2,
        MARKET_CLOSE: 3,
        LIQUIDATION: 4
    },
    TAKE_PROFIT_TYPE: {
        PRICE: 1,
        AMOUNT: 2
    },
    STOP_LOSS_TYPE: {
        PRICE: 1,
        AMOUNT: 2
    },
    TIMEOUTS: {
        DEFAULT: 3000,
        TEST: 15000
    },
};

module.exports = CONSTANTS;