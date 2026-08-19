import { useNavigate } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { SelectInput } from '../components/SelectInput';
import { HACKATHON, estimateRegistrationTotal, formatFeePerParticipant, formatMoney } from '../constants/hackathon';
import { ROUTES } from '../constants/routes';
import { useRegistrationDraft } from '../context/RegistrationDraftContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { validateTeamStep } from '../utils/registrationForm';
import { useState } from 'react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { draft, update } = useRegistrationDraft();
  const [errors, setErrors] = useState({});
  usePageTitle(`${HACKATHON.eventName} · Register`);

  const memberOptions = Array.from(
    { length: HACKATHON.team.maxMembers - HACKATHON.team.minMembers + 1 },
    (_, index) => HACKATHON.team.minMembers + index
  );

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateTeamStep(draft.teamName, Number(draft.memberCount));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    navigate(ROUTES.REGISTER_PARTICIPANTS);
  }

  return (
    <article className="register-page">
      <p className="eyebrow">Team registration</p>
      <h1 className="heading-serif">Team registration</h1>
      <p className="serif-kicker">Enter the Mugen</p>
      <div className="rule-line" aria-hidden="true">
        <span className="rule-line__diamond" />
      </div>
      <p className="lede">
        Name the team and choose how many participants will compete. Hostel fields appear only for
        hostel students on the next step. The fee is {formatFeePerParticipant()}.
      </p>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <FormInput
          id="teamName"
          label="Team name"
          value={draft.teamName}
          error={errors.teamName}
          maxLength={80}
          autoComplete="organization"
          required
          onChange={(value) => update({ teamName: value, submitted: false, registration: null })}
        />
        <SelectInput
          id="memberCount"
          label="Number of team members"
          value={String(draft.memberCount)}
          error={errors.memberCount}
          onChange={(value) =>
            update({
              memberCount: Number(value),
              submitted: false,
              registration: null,
            })
          }
        >
          {memberOptions.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </SelectInput>

        <p className="fee-preview">
          <span className="fee-preview__amount">
            {formatMoney(estimateRegistrationTotal(Number(draft.memberCount) || 0))}
          </span>
          <span className="fee-preview__note">
            Browser estimate. Payable amount is calculated on the server.
          </span>
        </p>

        <button className="btn" type="submit">
          Continue to participants
        </button>
      </form>
    </article>
  );
}
