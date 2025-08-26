import React from 'react';
import PropTypes from 'prop-types';
import './FormSelect.css';

/**
 * Reusable form select dropdown component
 * @param {Object} props - Component props
 * @param {string} props.label - Select label text
 * @param {string} props.value - Selected value
 * @param {function} props.onChange - Change handler function
 * @param {Array} props.options - Array of option objects {value, label}
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.className] - Additional CSS classes
 */
const FormSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  className = '',
  ...rest
}) => {
  // Handle select changes and pass value to parent
  const handleChange = (e) => {
    onChange(e.target.value, e);
  };

  // Generate unique ID for accessibility
  const selectId = `form-select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Check if there's an error to display
  const hasError = !!error;

  return (
    <div className={`form-select-container ${className} ${hasError ? 'has-error' : ''}`}>
      {/* Render label if provided */}
      {label && (
        <label htmlFor={selectId} className="form-select-label">
          {label}
          {/* Show required asterisk if field is required */}
          {required && <span className="form-select-required">*</span>}
        </label>
      )}
      
      {/* Main select dropdown */}
      <select
        id={selectId}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={`form-select ${hasError ? 'error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${selectId}-error` : undefined}
        {...rest}
      >
        {/* Placeholder option */}
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {/* Render all available options */}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Show error message if there's an error */}
      {hasError && (
        <span id={`${selectId}-error`} className="form-select-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

FormSelect.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

export default FormSelect;