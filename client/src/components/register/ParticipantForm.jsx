import { FormInput } from '../FormInput';
import { SelectInput } from '../SelectInput';
import { STUDENT_TYPE_OPTIONS } from '../../constants/registration';
import { isHostelMember } from '../../utils/registrationForm';

export function ParticipantForm({ member, index, errors, onChange }) {
  const prefix = `members[${index}]`;
  const hostel = isHostelMember(member.studentType);

  return (
    <article className="member-card">
      <header className="member-card__header">
        <h2>Participant {index + 1}</h2>
      </header>
      <div className="member-grid">
        <FormInput
          id={`${member.id}-name`}
          label="Name"
          value={member.name}
          error={errors[`${prefix}.name`]}
          autoComplete="name"
          maxLength={80}
          required
          onChange={(value) => onChange('name', value)}
        />
        <FormInput
          id={`${member.id}-registerNumber`}
          label="Register number"
          value={member.registerNumber}
          error={errors[`${prefix}.registerNumber`]}
          autoComplete="off"
          maxLength={30}
          required
          onChange={(value) => onChange('registerNumber', value)}
        />
        <FormInput
          id={`${member.id}-department`}
          label="Department"
          value={member.department}
          error={errors[`${prefix}.department`]}
          autoComplete="organization"
          maxLength={80}
          required
          onChange={(value) => onChange('department', value)}
        />
        <FormInput
          id={`${member.id}-section`}
          label="Section"
          value={member.section}
          error={errors[`${prefix}.section`]}
          autoComplete="off"
          maxLength={10}
          required
          onChange={(value) => onChange('section', value)}
        />
        <FormInput
          id={`${member.id}-phone`}
          label="Phone number"
          value={member.phone}
          error={errors[`${prefix}.phone`]}
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          required
          onChange={(value) => onChange('phone', value)}
        />
        <FormInput
          id={`${member.id}-email`}
          label="Email"
          type="email"
          value={member.email}
          error={errors[`${prefix}.email`]}
          autoComplete="email"
          maxLength={120}
          required
          onChange={(value) => onChange('email', value)}
        />
        <SelectInput
          id={`${member.id}-studentType`}
          label="Hostel or day scholar"
          value={member.studentType}
          error={errors[`${prefix}.studentType`]}
          onChange={(value) => onChange('studentType', value)}
        >
          {STUDENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
        {hostel ? (
          <>
            <FormInput
              id={`${member.id}-hostelName`}
              label="Hostel name"
              value={member.hostelName}
              error={errors[`${prefix}.hostelName`]}
              maxLength={80}
              required
              onChange={(value) => onChange('hostelName', value)}
            />
            <FormInput
              id={`${member.id}-roomNumber`}
              label="Room number"
              value={member.roomNumber}
              error={errors[`${prefix}.roomNumber`]}
              maxLength={20}
              required
              onChange={(value) => onChange('roomNumber', value)}
            />
          </>
        ) : null}
      </div>
    </article>
  );
}
