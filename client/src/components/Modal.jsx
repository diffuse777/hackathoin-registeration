import { useEffect, useId, useRef } from 'react';

export function Modal({ title, children, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        {onClose ? (
          <button ref={closeRef} type="button" className="visually-hidden" onClick={onClose}>
            Close
          </button>
        ) : (
          <button ref={closeRef} type="button" className="visually-hidden">
            Dialog
          </button>
        )}
      </div>
    </div>
  );
}
