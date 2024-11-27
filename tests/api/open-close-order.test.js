const axios = require("axios");
const { generateAuthToken } = require("../helpers/authTgToken");

let authTgToken;
let positionId;

beforeAll(() => {
  authTgToken = generateAuthToken();
});

it("should open market position", async () => {
  try {
    console.log("Generated Token:", authTgToken);

    const response = await axios.post(
      "https://api-uat.simple-spot.biz/api/v1/tg_invest/InvestAction/create-market-open-position",
      {
        symbol: "DOGEUSDT.FTS",
        amount: 2000,
        amountAssetId: "SMPL",
        multiplicator: 9,
        direction: 1,
        takeProfitType: 1,
        takeProfitValue: 0.4396455,
      },
      {
        headers: {
          Authorization: `Bearer ${authTgToken}`,
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      }
    );

    console.log("Full Response Data:", JSON.stringify(response.data, null, 2));
    expect(response.status).toBe(200);

    positionId = response.data?.data?.position?.id;
    console.log("Position ID:", positionId);

    expect(positionId).toBeDefined();
  } catch (error) {
    console.error("Request failed (open position):", error.response?.data || error.message);
    throw error;
  }
});


it("should close market position", async () => {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  try {
    expect(positionId).toBeDefined();
    console.log("Using Position ID:", positionId);
    const response = await axios.post(
      "https://api-uat.simple-spot.biz/api/v1/tg_invest/InvestAction/close-active-position",
      {
        positionId: positionId,
        clientClosePrice: 0
      },
      {
        headers: {
          Authorization: `Bearer ${authTgToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Full Response (close position):", JSON.stringify(response.data, null, 2));
    expect(response.status).toBe(200);
    console.log("Response Data (close position):", response.data);
  } catch (error) {
    console.error("Request failed (close position):", error.response?.data || error.message);
    throw error;
  }
});