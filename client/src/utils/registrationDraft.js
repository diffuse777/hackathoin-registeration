import { HACKATHON } from '../constants/hackathon';
import { createBlankMember, resizeMembers } from './registrationForm';

const DRAFT_KEY = 'quantex.registration.draft';
const SUCCESS_KEY = 'quantex.registration.success';

export function createEmptyDraft() {
  const memberCount = HACKATHON.team.maxMembers;
  return {
    teamName: '',
    memberCount,
    members: resizeMembers([], memberCount),
    registration: null,
    submitted: false,
  };
}

export function loadDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return createEmptyDraft();
    }

    const parsed = JSON.parse(raw);
    const memberCount = Number(parsed.memberCount) || HACKATHON.team.maxMembers;
    const members = Array.isArray(parsed.members) ? parsed.members : [];

    return {
      teamName: parsed.teamName || '',
      memberCount,
      members: members.length ? resizeMembers(members, memberCount) : resizeMembers([], memberCount),
      registration: parsed.registration || null,
      submitted: Boolean(parsed.submitted),
    };
  } catch {
    return createEmptyDraft();
  }
}

export function saveDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function loadSuccessSnapshot() {
  try {
    const raw = sessionStorage.getItem(SUCCESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSuccessSnapshot(snapshot) {
  sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(snapshot));
}

export function clearSuccessSnapshot() {
  sessionStorage.removeItem(SUCCESS_KEY);
}

export function ensureMemberShape(member) {
  return {
    ...createBlankMember(),
    ...member,
    id: member?.id || createBlankMember().id,
  };
}
