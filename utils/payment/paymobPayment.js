const BasePaymentService = require('./basePayment');
require('dotenv').config();

class PaymobPayment extends BasePaymentService {
  constructor() {
    super();
    this.base_url = process.env.PAYMOB_BASE_URL; // https://accept.paymob.com
    this.api_key = process.env.PAYMOB_API_KEY;
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    this.integrations_id = [
      process.env.PAYMOB_INTEGRATION_CARD_NUMBER,
      process.env.PAYMOB_INTEGRATION_WALLET_NUMBER,
    ]; // to make it support card and wallet payments
  }

  async generateTokenFromGateway() {
    const response = await this.buildRequest('POST', '/api/auth/tokens', {
      api_key: this.api_key,
    });
    // console.log(response);
    return response.data?.token;
  }
}

module.exports = PaymobPayment;
