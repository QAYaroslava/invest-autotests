# Invest Autotests

Automated testing suite for the Investment API service with gRPC integration.

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- UAT VPN access (if required)
- Access to the necessary proto files

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd invest-autotests
```

2. Install dependencies:
```bash
npm install
```

3. Connect to UAT VPN (if required for your environment)

### Running Tests

Execute all tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- investment-api.test.js
```

## 🔧 Adding New gRPC Services

### 1. Configure Service

Add a new service block to `grpc.config.js`:

```javascript
services: {
    helper: {
        host: process.env.TRADING_GRPC_HOST || 'invest-engine-prices.spot-services.svc.cluster.local',
        port: process.env.TRADING_GRPC_PORT || 80,
        protoPath: path.join(__dirname, '../proto/IGrpcHelperService.proto'),
        package: 'MyJetWallet.Sdk.GrpcSchema',
        service: 'GrpcHelperService'
    }
}
```

### 2. Import Client Factory

Add the following import to your test file:

```javascript
const { getClient, closeAll } = require('../helpers/grpc-client-factory');
```

### 3. Initialize Client

Get a gRPC client instance:

```javascript
const helperClient = await getClient('helper');
```

### 4. Make gRPC Requests

Send requests to your gRPC service:

```javascript
const quote = await helperClient.StringToDecimal({
    "Value": "1"
});
```

## 🧪 Testing Guidelines

- Each API service should have its own test file
- Use descriptive test names
- Include both positive and negative test cases
- Clean up resources in afterAll/afterEach blocks


## 🤝 Contributing

1. Create a new branch for your feature
2. Add tests for new functionality
3. Ensure all tests pass
4. Submit a pull request