import { Link } from 'react-router-dom';

export function ButtonLink({ to, variant = 'primary', children, ...props }) {
  const className = variant === 'primary' ? 'btn' : `btn btn--${variant}`;
  return (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  );
}
