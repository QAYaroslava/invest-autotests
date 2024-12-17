const path = require('path');

module.exports = {
    //NOTE: it's examples TODO: need to add real proto files and specify real host/port/protoPath
    services: {
        helper: {
            host: process.env.TRADING_GRPC_HOST || 'invest-engine-prices-demo.spot-services.svc.cluster.local',
            port: process.env.TRADING_GRPC_PORT || 80,
            protoPath: path.join(__dirname, '../proto/IGrpcHelperService.proto'),
            package: 'MyJetWallet.Sdk.GrpcSchema',
            service: 'GrpcHelperService'
        },
        invest: {
            host: process.env.TRADING_GRPC_HOST || 'invest-engine-prices-demo.spot-services.svc.cluster.local',
            port: process.env.TRADING_GRPC_PORT || 80,
            protoPath: path.join(__dirname, '../proto/IPriceManagerService.proto'),
            package: 'Service.InvestEngine.Prices.Grpc',
            service: 'PriceManagerService'
        },

    },
    defaultOptions: {
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 5000,
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [path.join(__dirname, '../proto')]
    }
};