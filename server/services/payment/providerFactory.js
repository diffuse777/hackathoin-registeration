const { PAYMENT_PROVIDERS } = require('../../utils/constants');
const MockPaymentProvider = require('./providers/mockPaymentProvider');
const RazorpayPaymentProvider = require('./providers/razorpayPaymentProvider');

let cachedProvider;

function createPaymentProvider(paymentConfig) {
  if (paymentConfig.provider === PAYMENT_PROVIDERS.RAZORPAY) {
    return new RazorpayPaymentProvider(paymentConfig);
  }

  return new MockPaymentProvider(paymentConfig);
}

function getPaymentProvider(paymentConfig) {
  if (!cachedProvider) {
    cachedProvider = createPaymentProvider(paymentConfig);
  }

  return cachedProvider;
}

function resetPaymentProviderCache() {
  cachedProvider = undefined;
}

module.exports = {
  createPaymentProvider,
  getPaymentProvider,
  resetPaymentProviderCache,
};
