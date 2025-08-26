import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormInput, FormSelect, FileUpload, Button, Alert } from '../../../ui';
import OCRProcessor from '../../../business/ocr/OCRProcessor';
import './OnboardingWizard.css';

/**
 * Complete customer onboarding wizard component
 * @param {Object} props - Component props
 * @param {function} props.onComplete - Callback when onboarding is completed
 * @param {Object} [props.initialData] - Initial form data
 * @param {function} [props.onStepChange] - Callback when step changes
 * @param {Array} [props.customSteps] - Custom step configuration
 */
const OnboardingWizard = ({
  onComplete,
  initialData = {},
  onStepChange,
  customSteps
}) => {
  // Component state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [processId, setProcessId] = useState(null);

  // Form data state with default structure
  const [formData, setFormData] = useState({
    customer: {
      fullName: "",
      dob: "",
      mobile: "",
      email: "",
      pep: false,
      income_band: "Not provided",
      occupation: "",
    },
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pin: "",
      country: "",
    },
    ids: {
      idType: "",
      idNumber: "",
    },
    product: {
      desired_account: "",
      expected_mab_range: "",
    },
    documents: [],
    kycStatus: "pending",
    riskAssessment: "pending",
    ...initialData
  });

  // Default step configuration
  const defaultSteps = [
    { id: 1, title: "Document & Basic Info", status: "active" },
    { id: 2, title: "Contact & Product Info", status: "pending" },
  ];

  // Use custom steps if provided, otherwise use defaults
  const steps = customSteps || defaultSteps;

  // Generate unique process ID on component mount
  useEffect(() => {
    setProcessId(`PROC-${Date.now()}`);
  }, []);

  // Add alert message with auto-dismiss
  const addAlert = (message, type = "info") => {
    const alert = { id: Date.now(), message, type };
    setAlerts((prev) => [...prev, alert]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    }, 5000);
  };

  // Handle form field changes
  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle file uploads and add to documents
  const handleFileUpload = (files) => {
    // Convert files to document objects with metadata
    const newFiles = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));

    // Add new files to form data
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newFiles],
    }));

    addAlert(`${newFiles.length} document(s) uploaded successfully`, "success");
  };

  // Handle OCR results and auto-fill form fields
  const handleOCRResult = (parsedData) => {
    console.log("OCR Result received:", parsedData);
    
    // Update form data with extracted OCR data
    setFormData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        fullName: parsedData.fullName || prev.customer.fullName,
        dob: parsedData.dob || prev.customer.dob,
      },
      ids: {
        ...prev.ids,
        idType: parsedData.idType || prev.ids.idType,
        idNumber: parsedData.idNumber || prev.ids.idNumber,
      },
      address: {
        ...prev.address,
        line1: parsedData.address || prev.address.line1,
      }
    }));

    addAlert("Document processed successfully! Form fields have been auto-filled.", "success");
  };

  const handleOCRError = (error) => {
    console.error("OCR Error:", error);
    addAlert("Failed to process document. Please fill the form manually.", "error");
  };

  const validateStep = (stepNumber) => {
    const errors = [];

    if (stepNumber === 1) {
      if (!formData.customer.fullName) errors.push("Full name is required");
      if (!formData.customer.dob) errors.push("Date of birth is required");
      if (!formData.ids.idType) errors.push("ID type is required");
      if (!formData.ids.idNumber) errors.push("ID number is required");
    }

    if (stepNumber === 2) {
      if (!formData.customer.email) errors.push("Email is required");
      if (!formData.customer.mobile) errors.push("Mobile number is required");
      if (!formData.product.desired_account) errors.push("Account type is required");
    }

    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep(currentStep);
    
    if (errors.length > 0) {
      errors.forEach(error => addAlert(error, "error"));
      return;
    }

    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (onStepChange) {
        onStepChange(nextStep, formData);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      if (onStepChange) {
        onStepChange(prevStep, formData);
      }
    }
  };

  const handleSubmit = async () => {
    const errors = validateStep(currentStep);
    
    if (errors.length > 0) {
      errors.forEach(error => addAlert(error, "error"));
      return;
    }

    setLoading(true);
    
    try {
      const submissionData = {
        ...formData,
        processId,
        submissionTimestamp: new Date().toISOString(),
      };

      if (onComplete) {
        await onComplete(submissionData);
      }

      setIsSubmitted(true);
      addAlert("Application submitted successfully!", "success");
    } catch (error) {
      console.error("Submission error:", error);
      addAlert("Failed to submit application. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const idTypeOptions = [
    { value: "", label: "Select ID Type" },
    { value: "aadhaar", label: "Aadhaar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "passport", label: "Passport" },
    { value: "voter", label: "Voter ID" },
  ];

  const accountTypeOptions = [
    { value: "", label: "Select Account Type" },
    { value: "savings", label: "Savings Account" },
    { value: "current", label: "Current Account" },
    { value: "salary", label: "Salary Account" },
  ];

  const incomeBandOptions = [
    { value: "Not provided", label: "Not provided" },
    { value: "0-25000", label: "₹0 - ₹25,000" },
    { value: "25000-50000", label: "₹25,000 - ₹50,000" },
    { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
    { value: "100000+", label: "₹1,00,000+" },
  ];

  if (isSubmitted) {
    return (
      <div className="onboarding-success">
        <div className="success-icon">✓</div>
        <h2>Application Submitted Successfully!</h2>
        <p>Your application ID is: <strong>{processId}</strong></p>
        <p>You will receive updates on your registered email and mobile number.</p>
      </div>
    );
  }

  return (
    <div className="onboarding-wizard">
      {/* Alerts */}
      <div className="alerts-container">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            type={alert.type}
            dismissible
            onDismiss={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          >
            {alert.message}
          </Alert>
        ))}
      </div>

      {/* Progress Steps */}
      <div className="step-progress">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step ${currentStep === step.id ? 'active' : ''} ${
              currentStep > step.id ? 'completed' : ''
            }`}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && (
          <div className="step-1">
            <h3>Document Upload & Basic Information</h3>
            
            <FileUpload
              label="Upload Identity Document"
              onFileSelect={handleFileUpload}
              acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxSize={5 * 1024 * 1024}
            />

            <OCRProcessor
              onTextExtracted={handleOCRResult}
              onError={handleOCRError}
              autoProcess={false}
            />

            <div className="form-grid">
              <FormInput
                label="Full Name"
                value={formData.customer.fullName}
                onChange={(value) => handleInputChange('customer', 'fullName', value)}
                required
              />

              <FormInput
                label="Date of Birth"
                type="date"
                value={formData.customer.dob}
                onChange={(value) => handleInputChange('customer', 'dob', value)}
                required
              />

              <FormSelect
                label="ID Type"
                value={formData.ids.idType}
                onChange={(value) => handleInputChange('ids', 'idType', value)}
                options={idTypeOptions}
                required
              />

              <FormInput
                label="ID Number"
                value={formData.ids.idNumber}
                onChange={(value) => handleInputChange('ids', 'idNumber', value)}
                required
              />

              <FormInput
                label="Address Line 1"
                value={formData.address.line1}
                onChange={(value) => handleInputChange('address', 'line1', value)}
              />

              <FormInput
                label="City"
                value={formData.address.city}
                onChange={(value) => handleInputChange('address', 'city', value)}
              />

              <FormInput
                label="State"
                value={formData.address.state}
                onChange={(value) => handleInputChange('address', 'state', value)}
              />

              <FormInput
                label="PIN Code"
                value={formData.address.pin}
                onChange={(value) => handleInputChange('address', 'pin', value)}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-2">
            <h3>Contact & Product Information</h3>
            
            <div className="form-grid">
              <FormInput
                label="Email"
                type="email"
                value={formData.customer.email}
                onChange={(value) => handleInputChange('customer', 'email', value)}
                required
              />

              <FormInput
                label="Mobile Number"
                type="tel"
                value={formData.customer.mobile}
                onChange={(value) => handleInputChange('customer', 'mobile', value)}
                required
              />

              <FormInput
                label="Occupation"
                value={formData.customer.occupation}
                onChange={(value) => handleInputChange('customer', 'occupation', value)}
              />

              <FormSelect
                label="Income Band"
                value={formData.customer.income_band}
                onChange={(value) => handleInputChange('customer', 'income_band', value)}
                options={incomeBandOptions}
              />

              <FormSelect
                label="Desired Account Type"
                value={formData.product.desired_account}
                onChange={(value) => handleInputChange('product', 'desired_account', value)}
                options={accountTypeOptions}
                required
              />

              <FormInput
                label="Expected Monthly Balance"
                value={formData.product.expected_mab_range}
                onChange={(value) => handleInputChange('product', 'expected_mab_range', value)}
                placeholder="e.g., 10000-25000"
              />
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.customer.pep}
                  onChange={(e) => handleInputChange('customer', 'pep', e.target.checked)}
                />
                <span>I am a Politically Exposed Person (PEP)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={loading}
          >
            Previous
          </Button>
        )}

        <div className="nav-spacer"></div>

        {currentStep < steps.length ? (
          <Button
            variant="primary"
            onClick={handleNextStep}
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
};

OnboardingWizard.propTypes = {
  onComplete: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  onStepChange: PropTypes.func,
  customSteps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string
    })
  )
};

export default OnboardingWizard;