const { CURRENCY, WEBHOOK_EVENTS } = require('../../../utils/constants');
const { rupeesToPaise, paiseToRupees } = require('../../../utils/money');
const { verifyHmacSha256Signature } = require('../../../utils/paymentSignature');
const AppError = require('../../../utils/AppError');
const { ERROR_CODES } = require('../../../utils/constants');

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

class RazorpayPaymentProvider {
  constructor({ keyId, keySecret, webhookSecret }) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.name = 'razorpay';
  }

  getName() {
    return this.name;
  }

  async createPaymentOrder({ amount, currency = CURRENCY, registrationId, receipt, notes }) {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: rupeesToPaise(amount),
        currency,
        receipt: String(receipt || registrationId).slice(0, 40),
        notes: {
          registrationId: String(registrationId),
          ...(notes || {}),
        },
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || !body.id) {
      throw new AppError('Failed to create payment order', 502, ERROR_CODES.INTERNAL_ERROR);
    }

    return {
      paymentOrderId: body.id,
      amount,
      currency: body.currency || currency,
      paymentRequest: {
        type: 'DYNAMIC_QR',
        provider: this.name,
        amount,
        currency: body.currency || currency,
        orderId: body.id,
        keyId: this.keyId,
        description: notes?.description || 'Hackathon registration',
      },
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    return verifyHmacSha256Signature(this.webhookSecret, rawBody, signature);
  }

  parseWebhookEvent(payload) {
    const eventName = payload?.event;
    const payment = payload?.payload?.payment?.entity || {};
    const order = payload?.payload?.order?.entity || {};

    const paymentOrderId = payment.order_id || order.id || null;
    const paymentTransactionId = payment.id || order.id || null;
    const amountPaise = payment.amount ?? order.amount;
    const amount = amountPaise != null ? paiseToRupees(amountPaise) : null;
    const currency = payment.currency || order.currency || CURRENCY;

    if (eventName === 'payment.failed') {
      return {
        eventType: WEBHOOK_EVENTS.PAYMENT_FAILED,
        paymentOrderId,
        paymentTransactionId,
        amount,
        currency,
      };
    }

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      return {
        eventType: WEBHOOK_EVENTS.PAYMENT_CAPTURED,
        paymentOrderId,
        paymentTransactionId,
        amount,
        currency,
      };
    }

    return {
      eventType: WEBHOOK_EVENTS.IGNORED,
      paymentOrderId,
      paymentTransactionId,
      amount,
      currency,
    };
  }
}

module.exports = RazorpayPaymentProvider;
