const { CURRENCY, WEBHOOK_EVENTS } = require('../../../utils/constants');
const { hmacSha256Hex, verifyHmacSha256Signature } = require('../../../utils/paymentSignature');

class MockPaymentProvider {
  constructor({ webhookSecret }) {
    this.webhookSecret = webhookSecret;
    this.name = 'mock';
  }

  getName() {
    return this.name;
  }

  async createPaymentOrder({ amount, currency = CURRENCY, registrationId, receipt, notes }) {
    const paymentOrderId = `order_mock_${Date.now()}_${String(registrationId).slice(-8)}`;

    return {
      paymentOrderId,
      amount,
      currency,
      paymentRequest: {
        type: 'DYNAMIC_QR',
        provider: this.name,
        amount,
        currency,
        orderId: paymentOrderId,
        description: notes?.description || 'Hackathon registration',
        qrPayload: `upi://pay?am=${amount}&cu=${currency}&tn=${encodeURIComponent(receipt || registrationId)}`,
      },
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    return verifyHmacSha256Signature(this.webhookSecret, rawBody, signature);
  }

  signWebhookBody(rawBody) {
    return hmacSha256Hex(this.webhookSecret, rawBody);
  }

  parseWebhookEvent(payload) {
    const eventName = payload?.event;
    const data = payload?.payload || {};

    if (eventName === 'payment.failed') {
      return {
        eventType: WEBHOOK_EVENTS.PAYMENT_FAILED,
        paymentOrderId: data.paymentOrderId,
        paymentTransactionId: data.paymentTransactionId,
        amount: Number(data.amount),
        currency: data.currency || CURRENCY,
      };
    }

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      return {
        eventType: WEBHOOK_EVENTS.PAYMENT_CAPTURED,
        paymentOrderId: data.paymentOrderId,
        paymentTransactionId: data.paymentTransactionId,
        amount: Number(data.amount),
        currency: data.currency || CURRENCY,
      };
    }

    return {
      eventType: WEBHOOK_EVENTS.IGNORED,
      paymentOrderId: data.paymentOrderId || null,
      paymentTransactionId: data.paymentTransactionId || null,
      amount: data.amount != null ? Number(data.amount) : null,
      currency: data.currency || CURRENCY,
    };
  }
}

module.exports = MockPaymentProvider;
