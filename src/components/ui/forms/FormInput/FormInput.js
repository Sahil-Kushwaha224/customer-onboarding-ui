import React from 'react';
import PropTypes from 'prop-types';
import './FormInput.css';

/**
 * Reusable form input component with validation and styling
 * @param {Object} props - Component props
 * @param {string} props.label - Input label text
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler function
 * @param {string} [props.type='text'] - Input type (text, email, tel, etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.inputProps] - Additional input props
 */
const FormInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error,
  className = '',
  inputProps = {},
  ...rest
}) => {
  // Handle input changes and pass value to parent
  const handleChange = (e) => {
    onChange(e.target.value, e);
  };

  // Generate unique ID for accessibility
  const inputId = `form-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Check if there's an error to display
  const hasError = !!error;

  return (
    <div className={`form-input-container ${className} ${hasError ? 'has-error' : ''}`}>
      {/* Render label if provided */}
      {label && (
        <label htmlFor={inputId} className="form-input-label">
          {label}
          {/* Show required asterisk if field is required */}
          {required && <span className="form-input-required">*</span>}
        </label>
      )}
      
      {/* Main input field */}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input ${hasError ? 'error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        {...inputProps}
        {...rest}
      />
      
      {/* Show error message if there's an error */}
      {hasError && (
        <span id={`${inputId}-error`} className="form-input-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

FormInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
  inputProps: PropTypes.object
};

export default FormInput;