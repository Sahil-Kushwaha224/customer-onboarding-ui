import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Reusable button component with multiple variants and states
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {function} [props.onClick] - Click handler function
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, ghost)
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 * @param {string} [props.type='button'] - Button type (button, submit, reset)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.leftIcon] - Icon to display on the left
 * @param {React.ReactNode} [props.rightIcon] - Icon to display on the right
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Handle button clicks, prevent action if disabled or loading
  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  // Build CSS classes based on props
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading ? 'btn-loading' : '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {/* Loading spinner - only show when loading */}
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="btn-spinner-icon" viewBox="0 0 24 24">
            <circle
              className="btn-spinner-path"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            />
          </svg>
        </span>
      )}
      
      {/* Left icon - hide when loading */}
      {!loading && leftIcon && (
        <span className="btn-icon btn-icon-left" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      {/* Button text content */}
      <span className={`btn-content ${loading ? 'btn-content-loading' : ''}`}>
        {children}
      </span>
      
      {/* Right icon - hide when loading */}
      {!loading && rightIcon && (
        <span className="btn-icon btn-icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node
};

export default Button;