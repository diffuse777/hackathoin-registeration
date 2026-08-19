export function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="alert alert--error" role="alert">
      <p>
        <strong>{title}.</strong> {message || 'The request could not be completed.'}
      </p>
      {onRetry ? (
        <p>
          <button type="button" className="text-button" onClick={onRetry}>
            Try again
          </button>
        </p>
      ) : null}
    </div>
  );
}
