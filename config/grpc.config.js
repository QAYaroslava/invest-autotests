const path = require('path');
const API_CONFIG = require('./environment');

module.exports = {
    services: {
        helper: {
            host: API_CONFIG.grpc.helper.host,
            port: API_CONFIG.grpc.helper.port,
            protoPath: path.join(__dirname, '../proto/IGrpcHelperService.proto'),
            package: 'MyJetWallet.Sdk.GrpcSchema',
            service: 'GrpcHelperService'
        },
        invest: {
            host: API_CONFIG.grpc.invest.host,
            port: API_CONFIG.grpc.invest.port,
            protoPath: path.join(__dirname, '../proto/IPriceManagerService.proto'),
            package: 'Service.InvestEngine.Prices.Grpc',
            service: 'PriceManagerService'
        },
        positionAction: {
            host: API_CONFIG.grpc.positionAction.host,
            port: API_CONFIG.grpc.positionAction.port,
            protoPath: path.join(__dirname, '../proto/IPositionActionService.proto'),
            package: 'Service.InvestEngine.Positions.Grpc',
            service: 'PositionActionService'
        },
    },
    defaultOptions: {
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: API_CONFIG.timeout,
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [path.join(__dirname, '../proto')]
    }
};