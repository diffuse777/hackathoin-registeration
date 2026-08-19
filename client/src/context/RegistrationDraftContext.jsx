import { createContext, useContext, useMemo, useState } from 'react';
import {
  clearDraft,
  createEmptyDraft,
  loadDraft,
  saveDraft,
} from '../utils/registrationDraft';
import { resizeMembers } from '../utils/registrationForm';

const RegistrationDraftContext = createContext(null);

export function RegistrationDraftProvider({ children }) {
  const [draft, setDraftState] = useState(() => loadDraft());

  const value = useMemo(() => {
    function setDraft(next) {
      setDraftState((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        saveDraft(resolved);
        return resolved;
      });
    }

    function update(partial) {
      setDraft((current) => {
        const next = { ...current, ...partial };
        if (partial.memberCount != null && partial.memberCount !== current.memberCount) {
          next.members = resizeMembers(current.members, partial.memberCount);
        }
        return next;
      });
    }

    function reset() {
      const empty = createEmptyDraft();
      setDraftState(empty);
      clearDraft();
    }

    return { draft, setDraft, update, reset };
  }, [draft]);

  return (
    <RegistrationDraftContext.Provider value={value}>{children}</RegistrationDraftContext.Provider>
  );
}

export function useRegistrationDraft() {
  const context = useContext(RegistrationDraftContext);
  if (!context) {
    throw new Error('useRegistrationDraft must be used within RegistrationDraftProvider');
  }
  return context;
}
