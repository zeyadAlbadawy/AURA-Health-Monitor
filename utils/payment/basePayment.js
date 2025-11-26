const axios = require('axios');

class BasePaymentService {
  constructor() {
    this.base_url = '';
    this.headers = {};
  }

  async buildRequest(method, url, data = null) {
    try {
      const requestConfig = {
        method,
        url: this.base_url + url,
        headers: this.headers,
        data, // api key will be send via request to paymob gateway
      };
      const response = await axios(requestConfig);
      return response;
    } catch (err) {
      return {
        success: false,
        status: 500,
        message: err.message,
      };
    }
  }
}

module.exports = BasePaymentService;
