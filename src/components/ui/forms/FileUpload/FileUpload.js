import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './FileUpload.css';

/**
 * Reusable file upload component with drag and drop support
 * @param {Object} props - Component props
 * @param {string} [props.label] - Upload area label
 * @param {function} props.onFileSelect - File selection handler
 * @param {Array} [props.acceptedTypes] - Accepted file types
 * @param {number} [props.maxSize] - Maximum file size in bytes
 * @param {boolean} [props.multiple=false] - Allow multiple file selection
 * @param {boolean} [props.disabled=false] - Whether upload is disabled
 * @param {string} [props.error] - Error message to display
 * @param {string} [props.className] - Additional CSS classes
 */
const FileUpload = ({
  label = 'Upload Documents',
  onFileSelect,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  disabled = false,
  error,
  className = '',
  ...rest
}) => {
  const fileInputRef = useRef(null);
  // Component state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Validate and process selected files
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      // Check if file type is allowed
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        errors.push(`${file.name}: Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Check if file size is within limit
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large. Maximum size: ${formatFileSize(maxSize)}`);
        return;
      }

      validFiles.push(file);
    });

    // Log validation errors (could be shown to user)
    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You might want to show these errors to the user
    }

    // Add valid files to state and notify parent
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      onFileSelect(validFiles);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Handle drag over event
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  // Handle drag leave event
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Handle file drop event
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled) {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove file from uploaded list
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if there's an error to display
  const hasError = !!error;

  return (
    <div className={`file-upload-container ${className} ${hasError ? 'has-error' : ''}`}>
      {/* Render label if provided */}
      {label && (
        <label className="file-upload-label">
          {label}
        </label>
      )}
      
      {/* Main upload area with drag & drop */}
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          disabled={disabled}
          className="file-upload-input"
          {...rest}
        />
        
        {/* Upload area content */}
        <div className="file-upload-content">
          {/* Upload icon */}
          <div className="file-upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          {/* Upload text */}
          <div className="file-upload-text">
            <p className="file-upload-primary">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="file-upload-secondary">
              {acceptedTypes.join(', ')} up to {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {/* List of uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="file-upload-list">
          <h4>Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="file-upload-item">
              {/* File information */}
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              {/* Remove file button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="file-remove-btn"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Show error message if there's an error */}
      {hasError && (
        <span className="file-upload-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  label: PropTypes.string,
  onFileSelect: PropTypes.func.isRequired,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  maxSize: PropTypes.number,
  multiple: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

export default FileUpload;