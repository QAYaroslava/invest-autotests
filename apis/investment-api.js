const axios = require("axios");
const logger = require("../helpers/logger");
const { getClient, closeAll } = require("../grpc/grpc-client-factory");
const API_CONFIG = require("../config/environment");
const CONSTANTS = require("../config/constants");

class InvestmentAPI {
  constructor(authToken) {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      validateStatus: (status) => status >= 200 && status < 500,
    });
    this.investClient = null;
    this.helperClient = null;
    this.positionActionClient = null;
  }

  async _initializeClients() {
    this.investClient = await getClient("invest");
    this.helperClient = await getClient("helper");
    this.positionActionClient = await getClient("positionAction");
  }

  closeGRPCConnections() {
    if (this.investClient || this.helperClient) {
      closeAll();
      this.investClient = null;
      this.helperClient = null;
      this.positionActionClient = null;
    }
  }

  async setupInstrumentPrice(symbol = "TEST2USDT.FTS", price = 1) {
    if (!this.investClient || !this.helperClient) {
      await this._initializeClients();
    }

    const quote = await this.helperClient.StringToDecimal({
      Value: `${price}`,
    });

    const makePriceRequest = {
      Symbol: symbol,
      Ask: quote["Value"],
      Bid: quote["Value"],
      Last: quote["Value"],
    };

    return await this.investClient.MakePrice(makePriceRequest);
  }

  async recalculateRollover(positionId) {
    if (!this.positionActionClient) {
      await this._initializeClients();
    }

    const RecalculatePositionRollOverRequest = {
      PositionId: positionId,
    };

    return await this.positionActionClient.RecalculatePositionRollOver(RecalculatePositionRollOverRequest);
  }

  async openMarketPosition(positionData) {
    try {
      const response = await this.axiosInstance.post(
        API_CONFIG.endpoints.openPosition,
        positionData
      );
      logger.info(`Creation of position:`, {
        data: {
          url: API_CONFIG.endpoints.openPosition,
          data: positionData,
        },
        response: response.data,
      });
      return response;
    } catch (error) {
      logger.error(
        `Failed to open position: ${error.response?.data || error.message}`
      );
      throw error;
    }
  }

  async closeMarketPosition(positionId, clientClosePrice = 0) {
    try {
      const response = await this.axiosInstance.post(
        API_CONFIG.endpoints.closePosition,
        {
          positionId: positionId,
          clientClosePrice: clientClosePrice,
        }
      );
      logger.info("Close of position:", {
        data: {
          url: API_CONFIG.endpoints.closePosition,
          data: { positionId, clientClosePrice },
        },
        response: response.data,
      });
      return response;
    } catch (error) {
      logger.error(
        `Failed to close position: ${error.response?.data || error.message}`
      );
      throw error;
    }
  }

  async openPendingLimitPosition(positionData) {
    try {
      const response = await this.axiosInstance.post(
        API_CONFIG.endpoints.openPendingLimitPosition,
        positionData
      );
      logger.info(`Creation of pending limit position:`, {
        data: {
          url: API_CONFIG.endpoints.openPendingLimitPosition,
          data: positionData,
        },
        response: response.data,
      });
      return response;
    } catch (error) {
      logger.error(
        `Failed to open pending position: ${error.response?.data || error.message}`
      );
      throw error;
    }
  }

  async openPendingStopPosition(positionData) {
    try {
      const response = await this.axiosInstance.post(
        API_CONFIG.endpoints.openPendingStopPosition,
        positionData
      );
      logger.info(`Creation of pending stop position:`, {
        data: {
          url: API_CONFIG.endpoints.openPendingStopPosition,
          data: positionData,
        },
        response: response.data,
      });
      return response;
    } catch (error) {
      logger.error(
        `Failed to open pending position: ${error.response?.data || error.message}`
      );
      throw error;
    }
  }

  async getPositionById(positionId) {
    try {
      const url = `${API_CONFIG.endpoints.getPosition}?positionId=${positionId}`;
      const requestBody = {
        positionId: positionId,
      };
      logger.info(`Getting position by id: ${positionId}`);
      const response = await this.axiosInstance.post(
        url,
        requestBody
      );

      logger.info(`Response: ${JSON.stringify(response.data, null, 4)}`);
  
      return response;

    } catch (error) {
      logger.error(
        `Failed to get position: ${error.response?.data || error.message}`,
        {
          fullError: error,
          status: error.response?.status,
          headers: error.response?.headers
        }
      );
      throw error;
    }
  }

  async openAndVerifyMarketPosition(positionData, price = 1,
      expectedStatus = CONSTANTS.POSITION_STATUS.OPENED) {
      try {
          await this.setupInstrumentPrice(positionData.symbol, price);
          
          const response = await this.openMarketPosition(positionData);
          if (response.status !== 200) {
              throw new Error(`Failed to open market position: ${response.data}`);
          }

          const positionId = response.data?.data?.position?.id;
          
          if (!positionId) {
              throw new Error('Position ID not found in response');
          }

          await this.setupInstrumentPrice(positionData.symbol, price);

          await this.waitForPositionStatus(positionId, expectedStatus);

          return positionId;

      } catch (error) {
          logger.error('Failed in openAndVerifyMarketPosition:', error);
          throw error;
      }
  }

  async closeAndVerifyMarketPosition(positionId, expectedCloseReason) {
    try {
        if (!positionId) {
            throw new Error('Position ID is not defined');
        }

        logger.info(`Closing market position with ID: ${positionId}`);
        const response = await this.closeMarketPosition(positionId);

        if (response.status !== 200) {
            throw new Error(`Failed to close market position: ${response.data}`);
        }

        const closeReason = response.data?.data?.position?.closeReason;
        logger.info(`Position close reason: ${closeReason}`);

        if (closeReason !== expectedCloseReason) {
            throw new Error(
                `Unexpected close reason: ${closeReason}. Expected: ${expectedCloseReason}`
            );
        }

        return closeReason;

    } catch (error) {
        logger.error('Failed in closeAndVerifyMarketPosition:', error);
        throw error;
    }
}

async verifyPositionCloseReason(positionId, expectedCloseReason) {
  try {
      logger.info(`Verifying close reason for position ID: ${positionId}`);
      const getPositionResponse = await this.getPositionById(positionId);

      if (getPositionResponse.status !== 200) {
          throw new Error(`Failed to get position details: ${getPositionResponse.data}`);
      }

      const closeReason = getPositionResponse.data?.data?.position?.closeReason;
      logger.info(`Close reason for position ${positionId}: ${closeReason}`);

      if (closeReason !== expectedCloseReason) {
          throw new Error(
              `Unexpected close reason for position ${positionId}. Expected: ${expectedCloseReason}, receive: ${closeReason}`
          );
      }

      logger.info(`Close reason verified successfully for position ${positionId}`);
      return closeReason;

  } catch (error) {
      logger.error('Failed in verifyPositionCloseReason:', error);
      throw error;
  }
}

  /**
   * Calculates and sets StopOut price for a position
   * @param {string} positionId - Position ID
   * @param {number} instrumentStopOut - Stop Out coefficient (default: 0.1)
   * @returns {Promise<number>} Calculated StopOut price
   */
  async calculateAndSetStopOutPrice(positionId, instrumentStopOut = 0.1) {
      const position = await this.getPositionById(positionId);
      const { openPrice, volume, multiplicator, openFee, rollOver, closeFee, direction } = position.data?.data?.position;

      const stopOutPl = -volume / multiplicator * (1 - instrumentStopOut);
      const buySell = direction === CONSTANTS.DIRECTION.BUY ? 1 : -1;
      
      const stopOutPrice = parseFloat(
          (openPrice * (1 + buySell * (stopOutPl + openFee - rollOver + closeFee) / volume)).toFixed(4)
      );

      await this.setupInstrumentPrice(position.data?.data?.position?.symbol, stopOutPrice);
      return stopOutPrice;
  }

    /**
     * Waits for a position to reach a specific status
     * @param {string} positionId - Position ID to check
     * @param {string} expectedStatus - Status to wait for
     * @param {number} timeout - Time to wait between checks
     * @param {number} maxAttempts - Maximum number of status check attempts
     * @returns {Promise<Object>} Position data
     */
  async waitForPositionStatus(positionId, expectedStatus, timeout = 1000, maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, timeout));
        
        const response = await this.getPositionById(positionId);
        const position = response.data?.data?.position;
        
        if (!position) {
            throw new Error(`Position ${positionId} not found`);
        }

        if (position.status === expectedStatus) {
            return position;
        }

        if (attempt === maxAttempts) {
            throw new Error(
                `Position ${positionId} did not reach ${expectedStatus} status after ${maxAttempts} attempts. ` +
                `Current status: ${position.status}`
            );
        }

        logger.info(`Waiting for position ${positionId} to reach status ${expectedStatus}. ` +
                   `Current status: ${position.status}. Attempt ${attempt}/${maxAttempts}`);
    }
  }
}


module.exports = InvestmentAPI;
