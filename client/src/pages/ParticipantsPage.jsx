import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { ParticipantForm } from '../components/register/ParticipantForm';
import { RegistrationSummary } from '../components/register/RegistrationSummary';
import { HACKATHON } from '../constants/hackathon';
import { API_ERROR_CODES } from '../constants/api';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { createRegistration } from '../services/registrationService';
import { getErrorMessage } from '../utils/apiError';
import {
  BLOCKED_REGISTER_MESSAGE,
  fieldErrorsFromApi,
  findBlockedRegisterIndex,
  isBlockedRegisterNumber,
  toRegistrationPayload,
  updateMemberField,
  validateRegistrationForm,
  validateTeamStep,
} from '../utils/registrationForm';

export function ParticipantsPage() {
  const navigate = useNavigate();
  const { draft, setDraft, update } = useRegistrationDraft();
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  usePageTitle(`${HACKATHON.eventName} · Participants`);

  const teamErrors = validateTeamStep(draft.teamName, draft.memberCount);
  if (Object.keys(teamErrors).length > 0) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  function markBlockedRegister(index) {
    setBlockedNotice(true);
    setReviewing(false);
    setFormError(BLOCKED_REGISTER_MESSAGE);
    if (index >= 0) {
      setFieldErrors((current) => ({
        ...current,
        [`members[${index}].registerNumber`]: BLOCKED_REGISTER_MESSAGE,
      }));
    }
  }

  function handleMemberChange(index, field, value) {
    setDraft((current) => ({
      ...current,
      submitted: false,
      registration: null,
      members: current.members.map((member, memberIndex) =>
        memberIndex === index ? updateMemberField(member, field, value) : member
      ),
    }));
    setFormError('');
    if (field === 'registerNumber' && isBlockedRegisterNumber(value)) {
      markBlockedRegister(index);
    }
  }

  function handleReview(event) {
    event.preventDefault();
    const blockedIndex = findBlockedRegisterIndex(draft.members);
    if (blockedIndex >= 0) {
      markBlockedRegister(blockedIndex);
      return;
    }
    const errors = validateRegistrationForm(draft.teamName, draft.members);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(errors.members || 'Check the highlighted fields and try again.');
      setReviewing(false);
      return;
    }
    setFormError('');
    setReviewing(true);
  }

  async function handleContinueToPayment() {
    const blockedIndex = findBlockedRegisterIndex(draft.members);
    if (blockedIndex >= 0) {
      markBlockedRegister(blockedIndex);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const result = await createRegistration(toRegistrationPayload(draft.teamName, draft.members));
      const registration = result.data;
      if (!registration?.id) {
        throw new Error('Registration was created, but payment cannot start yet.');
      }
      update({ registration, submitted: true });
      navigate(ROUTES.REGISTER_PAYMENT);
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error.details));
      if (error.code === API_ERROR_CODES.BLOCKED_REGISTER_NUMBER) {
        markBlockedRegister(findBlockedRegisterIndex(draft.members));
      } else {
        setFormError(getErrorMessage(error));
        setReviewing(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Team registration</p>
      <h1 className="heading-serif">Participants</h1>
      <p className="lede">
        Complete one form for every member of {draft.teamName}. Hostel name and room number appear
        only for hostel students.
      </p>

      {reviewing ? (
        <>
          <RegistrationSummary teamName={draft.teamName} members={draft.members} />
          <div className="register-form__bar">
            <button type="button" className="btn btn--secondary" onClick={() => setReviewing(false)}>
              Edit details
            </button>
            <button type="button" className="btn" onClick={handleContinueToPayment} disabled={submitting}>
              {submitting ? 'Creating registration…' : 'Continue to payment'}
            </button>
          </div>
          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
        </>
      ) : (
        <form className="register-form" onSubmit={handleReview} noValidate>
          {draft.members.map((member, index) => (
            <ParticipantForm
              key={member.id}
              member={member}
              index={index}
              errors={fieldErrors}
              onChange={(field, value) => handleMemberChange(index, field, value)}
            />
          ))}
          <div className="register-form__bar">
            <Link className="btn btn--secondary" to={ROUTES.REGISTER}>
              Back
            </Link>
            <button className="btn" type="submit">
              Review registration
            </button>
          </div>
          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      )}

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
