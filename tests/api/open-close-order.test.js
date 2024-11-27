const axios = require("axios");
const logger = require('../helpers/logger');
const {generateAuthToken} = require("../helpers/authTgToken");
const { getClient, closeAll } = require('../helpers/grpc-client-factory');

let authTgToken;
let positionId;
// let investClient;
// let helperClient;

beforeAll(async () => {
    // investClient = await getClient('invest');
    // helperClient = await getClient('helper');
    authTgToken = generateAuthToken();
    logger.info(`Generated token: ${authTgToken}`);
});

afterAll(() => {
    closeAll();
});

it("should open market position", async () => {
    // let quote = await helperClient.StringToDecimal({
    //     "Value": "1"
    // });
    // const makePriceRequest = {
    //     "Symbol": "TEST2USDT.FTS",
    //     "Ask": quote['Value'],
    //     "Bid": quote['Value'],
    //     "Last": quote['Value']
// };
//     const makePrice = await investClient.MakePrice(makePriceRequest);
    try {
        const url = "https://api-uat.simple-spot.biz/api/v1/tg_invest/InvestAction/create-market-open-position"
        const data = {
            symbol: "DOGEUSDT.FTS",
            amount: 2000,
            amountAssetId: "SMPL",
            multiplicator: 9,
            direction: 1,
            takeProfitType: 1,
            takeProfitValue: 0.4396455,
        }
        const headers = {
            Authorization: `Bearer ${authTgToken}`,
            "Content-Type": "application/json",
        }

        const response = await axios.post(
            url,
            data,
            {
                headers: headers,
                validateStatus: function (status) {
                    return status >= 200 && status < 500;
                },
            }
        );

        logger.info(`Creation of position:`,
            {
                data: {
                    url: url,
                    data: data
                },
                response: response.data
            });

        expect(response.status).toBe(200);

        positionId = response.data?.data?.position?.id;
        logger.info(`Position ID: ${positionId}`);

        expect(positionId).toBeDefined();
    } catch (error) {
        logger.error(`Request failed: ${error.response?.data || error.message}`);
        throw error;
    }
});


it("should close market position", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    try {
        expect(positionId).toBeDefined();
        const url = "https://api-uat.simple-spot.biz/api/v1/tg_invest/InvestAction/close-active-position"
        const data = {
            positionId: positionId,
            clientClosePrice: 0
        }
        const headers = {
            Authorization: `Bearer ${authTgToken}`,
            "Content-Type": "application/json",
        }

        logger.info(`Using Position ID: ${positionId}`);

        const response = await axios.post(
            url,
            data,
            {
                headers: headers,
            }
        );

        logger.info(`Close of position:`,
            {
                data: {
                    url: url,
                    data: data
                },
                response: response.data
            });

        expect(response.status).toBe(200);

    } catch (error) {
        logger.error(`Request failed: ${error.response?.data || error.message}`);
        throw error;
    }
});