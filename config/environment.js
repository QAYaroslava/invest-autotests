require('dotenv').config();

const API_CONFIG = {
    baseURL: process.env.API_BASE_URL || "https://api-uat.simple-spot.biz/api/v1/tg_invest",
    timeout: parseInt(process.env.API_TIMEOUT || "5000"),
    endpoints: {
        openPosition: process.env.ENDPOINT_OPEN_POSITION || "InvestAction/create-market-open-position",
        closePosition: process.env.ENDPOINT_CLOSE_POSITION || "InvestAction/create-market-close-position",
        getPosition: process.env.ENDPOINT_GET_POSITION || "InvestAction/get-position"
    },
    grpc: {
        helper: {
            host: process.env.HELPER_GRPC_HOST || 'invest-engine-prices-demo.spot-services.svc.cluster.local',
            port: parseInt(process.env.HELPER_GRPC_PORT || "80")
        },
        invest: {
            host: process.env.INVEST_GRPC_HOST || 'invest-engine-prices-demo.spot-services.svc.cluster.local',
            port: parseInt(process.env.INVEST_GRPC_PORT || "80")
        },
        positionAction: {
            host: process.env.POSITION_ACTION_GRPC_HOST || 'services-invest-engine-positions.simple-spot.biz',
            port: parseInt(process.env.POSITION_ACTION_GRPC_PORT || "82")
        }
    }
};

// TODO: use CONSTANTS at test cases
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
    TIMEOUTS: {
        DEFAULT: 3000,
        TEST: 15000
    },
};

module.exports = API_CONFIG;