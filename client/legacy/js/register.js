const FEE = 350;
const MAX_MEMBERS = 6;

const membersEl = document.getElementById('members');
const feePreview = document.getElementById('fee-preview');
const registerError = document.getElementById('register-error');

let members = [blankMember()];

function blankMember() {
  return {
    name: '',
    registerNumber: '',
    department: '',
    section: '',
    phone: '',
    email: '',
    studentType: 'DAY_SCHOLAR',
    hostelName: '',
    roomNumber: '',
  };
}

function setError(message) {
  registerError.hidden = !message;
  registerError.textContent = message || '';
}

function escapeAttr(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}

function renderMembers() {
  membersEl.innerHTML = members
    .map(
      (member, index) => `
      <article class="member-card">
        <header>
          <strong>Member ${index + 1}</strong>
          ${
            members.length > 1
              ? `<button class="remove-member" type="button" data-remove="${index}">Remove</button>`
              : ''
          }
        </header>
        <div class="member-grid">
          <label class="field">Name<input data-field="name" data-index="${index}" value="${escapeAttr(member.name)}" required /></label>
          <label class="field">Register no.<input data-field="registerNumber" data-index="${index}" value="${escapeAttr(member.registerNumber)}" required /></label>
          <label class="field">Department<input data-field="department" data-index="${index}" value="${escapeAttr(member.department)}" required /></label>
          <label class="field">Section<input data-field="section" data-index="${index}" value="${escapeAttr(member.section)}" required /></label>
          <label class="field">Phone<input data-field="phone" data-index="${index}" value="${escapeAttr(member.phone)}" maxlength="10" required /></label>
          <label class="field">Email<input type="email" data-field="email" data-index="${index}" value="${escapeAttr(member.email)}" required /></label>
          <label class="field">Student type
            <select data-field="studentType" data-index="${index}">
              <option value="DAY_SCHOLAR" ${member.studentType === 'DAY_SCHOLAR' ? 'selected' : ''}>Day scholar</option>
              <option value="HOSTEL" ${member.studentType === 'HOSTEL' ? 'selected' : ''}>Hostel</option>
            </select>
          </label>
          ${
            member.studentType === 'HOSTEL'
              ? `<label class="field">Hostel<input data-field="hostelName" data-index="${index}" value="${escapeAttr(member.hostelName)}" required /></label>
                 <label class="field">Room<input data-field="roomNumber" data-index="${index}" value="${escapeAttr(member.roomNumber)}" required /></label>`
              : ''
          }
        </div>
      </article>`
    )
    .join('');

  feePreview.textContent = `₹${members.length * FEE}`;
}

function readMembersFromForm() {
  document.querySelectorAll('[data-field]').forEach((input) => {
    const index = Number(input.dataset.index);
    members[index][input.dataset.field] = input.value.trim();
  });
}

membersEl.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  const index = Number(event.target.dataset.index);
  if (!field) return;
  members[index][field] = event.target.value;
});

membersEl.addEventListener('change', (event) => {
  if (event.target.dataset.field === 'studentType') {
    readMembersFromForm();
    renderMembers();
  }
});

membersEl.addEventListener('click', (event) => {
  if (event.target.dataset.remove == null) return;
  readMembersFromForm();
  members.splice(Number(event.target.dataset.remove), 1);
  renderMembers();
});

document.getElementById('add-member').addEventListener('click', () => {
  if (members.length >= MAX_MEMBERS) return;
  readMembersFromForm();
  members.push(blankMember());
  renderMembers();
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  readMembersFromForm();
  setError('');

  const payload = {
    teamName: event.target.teamName.value.trim(),
    members: members.map((member) => {
      const item = {
        name: member.name,
        registerNumber: member.registerNumber,
        department: member.department,
        section: member.section,
        phone: member.phone,
        email: member.email,
        studentType: member.studentType,
      };
      if (member.studentType === 'HOSTEL') {
        item.hostelName = member.hostelName;
        item.roomNumber = member.roomNumber;
      }
      return item;
    }),
  };

  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok) {
      const details = json?.error?.details?.map((item) => item.message).join(' ') || '';
      throw new Error(json?.message || details || 'Registration failed');
    }
    window.location.href = `/pay?id=${encodeURIComponent(json.data.id)}`;
  } catch (error) {
    setError(error.message);
  }
});

renderMembers();
