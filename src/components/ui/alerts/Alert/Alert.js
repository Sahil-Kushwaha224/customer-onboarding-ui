import React from 'react';
import PropTypes from 'prop-types';
import './Alert.css';

/**
 * Reusable alert component for displaying notifications
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} [props.type='info'] - Alert type (success, error, warning, info)
 * @param {string} [props.title] - Alert title
 * @param {boolean} [props.dismissible=false] - Whether alert can be dismissed
 * @param {function} [props.onDismiss] - Dismiss handler function
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.icon] - Custom icon component
 */
const Alert = ({
  children,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
  icon,
  ...rest
}) => {
  // Get default icon based on alert type
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  // Handle alert dismissal
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  // Build CSS classes based on props
  const alertClasses = [
    'alert',
    `alert-${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={alertClasses} role="alert" {...rest}>
      <div className="alert-content">
        {/* Alert icon */}
        <div className="alert-icon" aria-hidden="true">
          {icon || getDefaultIcon()}
        </div>
        
        {/* Alert content */}
        <div className="alert-body">
          {/* Alert title (optional) */}
          {title && (
            <div className="alert-title">
              {title}
            </div>
          )}
          {/* Alert message */}
          <div className="alert-message">
            {children}
          </div>
        </div>
        
        {/* Dismiss button (if dismissible) */}
        {dismissible && (
          <button
            type="button"
            className="alert-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
  icon: PropTypes.node
};

export default Alert;