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

module.exports = API_CONFIG;