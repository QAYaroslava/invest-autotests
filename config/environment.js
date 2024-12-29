require('dotenv').config();

const API_CONFIG = {
    baseURL: process.env.API_BASE_URL,
    timeout: parseInt(process.env.API_TIMEOUT),
    endpoints: {
        openPosition: process.env.ENDPOINT_OPEN_POSITION,
        closePosition: process.env.ENDPOINT_CLOSE_POSITION,
        getPosition: process.env.ENDPOINT_GET_POSITION,
        openPendingLimitPosition: process.env.ENDPOINT_OPEN_PENDING_LIMIT,
        openPendingStopPosition: process.env.ENDPOINT_OPEN_PENDING_STOP
    },
    grpc: {
        helper: {
            host: process.env.HELPER_GRPC_HOST,
            port: parseInt(process.env.HELPER_GRPC_PORT)
        },
        invest: {
            host: process.env.INVEST_GRPC_HOST,
            port: parseInt(process.env.INVEST_GRPC_PORT)
        },
        positionAction: {
            host: process.env.POSITION_ACTION_GRPC_HOST,
            port: parseInt(process.env.POSITION_ACTION_GRPC_PORT)
        }
    }
};

module.exports = API_CONFIG;