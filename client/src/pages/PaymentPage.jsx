import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { Modal } from '../components/Modal';
import { PaymentSummary } from '../components/register/PaymentSummary';
import { QRPayment } from '../components/register/QRPayment';
import { formatMoney, HACKATHON } from '../constants/hackathon';
import { PAYMENT_STATUSES, BLOCKED_REGISTER_MESSAGE } from '../constants/registration';
import { API_ERROR_CODES } from '../constants/api';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { completeMockPayment, createPaymentOrder, getPaymentStatus, submitPaymentReference } from '../services/paymentService';
import { getErrorMessage } from '../utils/apiError';
import { clearDraft, saveSuccessSnapshot } from '../utils/registrationDraft';

export function PaymentPage() {
  const navigate = useNavigate();
  const { draft, reset } = useRegistrationDraft();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingLabel, setLoadingLabel] = useState('Generating payment…');
  const [error, setError] = useState('');
  const [showReferenceForm, setShowReferenceForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [referenceError, setReferenceError] = useState('');
  const [savingReference, setSavingReference] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  const leavingHomeRef = useRef(false);
  usePageTitle(`${HACKATHON.eventName} · Payment`);

  const registrationId = draft.registration?.id;

  useEffect(() => {
    if (!registrationId) {
      return undefined;
    }

    let cancelled = false;

    async function start() {
      setLoadingLabel('Generating payment…');
      setError('');
      try {
        const result = await createPaymentOrder(registrationId);
        if (!cancelled) {
          setOrder(result.data);
          setStatus(result.data.paymentStatus);
        }
      } catch (err) {
        if (err.code === 'PAYMENT_ALREADY_COMPLETED') {
          try {
            const current = await getPaymentStatus(registrationId);
            if (!cancelled) {
              setStatus(current.data.paymentStatus);
              setOrder((existing) => existing || current.data);
            }
          } catch (statusError) {
            if (!cancelled) {
              setError(getErrorMessage(statusError));
            }
          }
        } else if (!cancelled) {
          if (err.code === API_ERROR_CODES.BLOCKED_REGISTER_NUMBER) {
            setBlockedNotice(true);
          }
          setError(getErrorMessage(err));
        }
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [registrationId]);

  useEffect(() => {
    if (!registrationId || status === PAYMENT_STATUSES.PAID) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        setLoadingLabel('Verifying payment…');
        const result = await getPaymentStatus(registrationId);
        setStatus(result.data.paymentStatus);
        if (result.data.paymentStatus === PAYMENT_STATUSES.PAID) {
          setOrder((current) => ({ ...current, ...result.data }));
        }
      } catch {
        // Keep polling; a transient network error should not fake success.
      }
    }, 4000);

    return () => window.clearInterval(timer);
  }, [registrationId, status]);

  useEffect(() => {
    if (status !== PAYMENT_STATUSES.PAID || !order) {
      return;
    }

    const snapshot = {
      teamName: order.teamName || draft.teamName,
      memberCount: order.memberCount || draft.memberCount,
      totalAmount: order.amount,
      paymentStatus: PAYMENT_STATUSES.PAID,
      paymentReference: paymentReference.trim() || order.paymentReference || '',
    };
    saveSuccessSnapshot(snapshot);
  }, [status, order, draft.teamName, draft.memberCount]);

  useEffect(() => {
    if (!showSuccess) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      goHome();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  function goHome() {
    leavingHomeRef.current = true;
    navigate(ROUTES.HOME, { replace: true });
    reset();
    clearDraft();
  }

  if (leavingHomeRef.current) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (!registrationId) {
    return <Navigate to={ROUTES.REGISTER_PARTICIPANTS} replace />;
  }

  const qrImage = order?.paymentRequest?.qrImageDataUrl;
  const amount = order?.amount;
  const provider = order?.paymentRequest?.provider;
  const trimmedReference = paymentReference.trim();
  const referenceLooksValid = /^[A-Za-z0-9][A-Za-z0-9/_-]{5,63}$/.test(trimmedReference);

  async function handleVerify() {
    setError('');
    setLoadingLabel('Verifying payment…');
    try {
      if (provider === 'mock' && status !== PAYMENT_STATUSES.PAID) {
        await completeMockPayment(registrationId, 'success');
      }
      const result = await getPaymentStatus(registrationId);
      setStatus(result.data.paymentStatus);
      setOrder((current) => ({ ...current, ...result.data }));
      if (result.data.paymentStatus === PAYMENT_STATUSES.PAID) {
        const existing = result.data.paymentReference;
        if (existing && !String(existing).startsWith('txn_mock_')) {
          setPaymentReference(existing);
        }
        setShowReferenceForm(true);
        return;
      }
      setError(
        result.data.paymentStatus === PAYMENT_STATUSES.FAILED
          ? 'Payment failed. Please try again.'
          : 'Payment is still pending. Complete the transfer, then verify again.'
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSubmitReference(event) {
    event.preventDefault();
    const reference = paymentReference.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{5,63}$/.test(reference)) {
      setReferenceError('Enter the UPI or bank transaction ID (6–64 characters).');
      return;
    }

    setReferenceError('');
    setSavingReference(true);
    try {
      await submitPaymentReference(registrationId, reference);
      saveSuccessSnapshot({
        teamName: order?.teamName || draft.teamName,
        memberCount: order?.memberCount || draft.memberCount,
        totalAmount: amount,
        paymentStatus: PAYMENT_STATUSES.PAID,
        paymentReference: reference,
      });
      setShowReferenceForm(false);
      setShowSuccess(true);
    } catch (err) {
      setReferenceError(getErrorMessage(err));
    } finally {
      setSavingReference(false);
    }
  }

  function handleFinish() {
    goHome();
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Payment</p>
      <h1 className="heading-serif">Payment</h1>
      <p className="lede">Scan the QR code and complete the payment. Success is confirmed only after server verification.</p>

      {error ? <ErrorState title="Payment verification failed" message={error} onRetry={handleVerify} /> : null}

      {!order && !error ? <LoadingState label={loadingLabel} /> : null}

      {order ? (
        <div className="register-layout">
          <div>
            <PaymentSummary
              teamName={order.teamName || draft.teamName}
              memberCount={order.memberCount || draft.memberCount}
              amount={amount}
            />
            <p className="payment-amount">{amount != null ? formatMoney(amount) : 'Calculating amount…'}</p>
            {qrImage ? (
              <QRPayment imageSrc={qrImage} amountLabel={amount != null ? formatMoney(amount) : ''} />
            ) : (
              <ErrorState
                title="Payment QR unavailable"
                message="The payment provider did not return a QR code. Do not invent or upload a substitute image."
              />
            )}
            <p className="lede">
              Amount payable: {amount != null ? formatMoney(amount) : 'awaiting server total'}. Payment
              status: {status || PAYMENT_STATUSES.PENDING}.
            </p>
            <button className="btn" type="button" onClick={handleVerify}>
              Verify payment
            </button>
          </div>
        </div>
      ) : null}

      {showReferenceForm ? (
        <Modal title="Enter payment reference">
          <p className="lede">Enter the UPI or bank transaction ID shown after you paid.</p>
          <form className="register-form" onSubmit={handleSubmitReference}>
            <FormInput
              id="payment-reference"
              label="Enter payment reference"
              value={paymentReference}
              error={referenceError}
              autoComplete="off"
              autoFocus
              required
              maxLength={64}
              placeholder="UPI / bank transaction ID"
              onChange={(value) => {
                setPaymentReference(value);
                setReferenceError('');
              }}
            />
            <button className="btn" type="submit" disabled={savingReference || !referenceLooksValid}>
              {savingReference ? 'Saving…' : 'Submit'}
            </button>
          </form>
        </Modal>
      ) : null}

      {showSuccess ? (
        <Modal title="Payment successful">
          <p>Payment is successful.</p>
          <p className="serif-kicker modal__challenge">Be ready to face the challenge.</p>
          <dl className="summary-grid">
            <dt>Team name</dt>
            <dd>{order?.teamName || draft.teamName}</dd>
            <dt>Participants</dt>
            <dd>{order?.memberCount || draft.memberCount}</dd>
            <dt>Total amount</dt>
            <dd>{amount != null ? formatMoney(amount) : '—'}</dd>
            {paymentReference.trim() ? (
              <>
                <dt>Payment reference</dt>
                <dd>{paymentReference.trim()}</dd>
              </>
            ) : null}
          </dl>
          <button className="btn" type="button" onClick={handleFinish}>
            Return home
          </button>
        </Modal>
      ) : null}

      {blockedNotice ? (
        <Modal title="Registration blocked" onClose={() => setBlockedNotice(false)}>
          <p>{BLOCKED_REGISTER_MESSAGE}</p>
          <div className="register-form__bar">
            <button className="btn" type="button" onClick={() => setBlockedNotice(false)}>
              OK
            </button>
          </div>
        </Modal>
      ) : null}
    </article>
  );
}
