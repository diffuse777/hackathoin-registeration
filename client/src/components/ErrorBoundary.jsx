import { Component } from 'react';
import { getErrorMessage } from '../utils/apiError';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="app-main app-main--page" role="alert">
        <p className="eyebrow">Error</p>
        <h1 className="heading-serif">Something went wrong</h1>
        <p className="lede">Please try again.</p>
        <p>{getErrorMessage(this.state.error)}</p>
        <p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Try again
          </button>{' '}
          <a className="btn btn--secondary" href="/">
            Return home
          </a>
        </p>
      </main>
    );
  }
}
