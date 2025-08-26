import React, { useState } from 'react';
import { OnboardingWizard, Alert } from '../components';

/**
 * Example page showing how to use the new OnboardingWizard component
 */
const NewOnboardingPage = () => {
  // Component state
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Handle form submission when onboarding is complete
  const handleOnboardingComplete = async (formData) => {
    try {
      console.log('Submitting onboarding data:', formData);
      
      // Simulate API call
      const response = await fetch('/api/customer-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Onboarding submission successful:', result);
      
      setSubmissionResult(result);
      setShowSuccess(true);
      
      // You could redirect to a success page or show a success message
      // window.location.href = '/onboarding-success';
      
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      // The OnboardingWizard will handle showing the error
      throw error; // Re-throw to let the wizard handle it
    }
  };

  // Handle step changes and save progress
  const handleStepChange = (step, data) => {
    console.log(`User completed step ${step}:`, data);
    
    // Save progress to localStorage for recovery
    localStorage.setItem('onboarding-progress', JSON.stringify({
      currentStep: step,
      formData: data,
      timestamp: new Date().toISOString()
    }));
  };

  // Load any previously saved progress
  const getSavedProgress = () => {
    try {
      const saved = localStorage.getItem('onboarding-progress');
      if (saved) {
        const progress = JSON.parse(saved);
        // Only use saved data if it's recent (within 24 hours)
        const savedTime = new Date(progress.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return progress.formData;
        }
      }
    } catch (error) {
      console.warn('Could not load saved progress:', error);
    }
    return {};
  };

  // Show success page after submission
  if (showSuccess && submissionResult) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        {/* Success message */}
        <Alert type="success" title="Application Submitted Successfully!">
          Your application has been submitted with ID: <strong>{submissionResult.applicationId || submissionResult.processId}</strong>
        </Alert>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2>What's Next?</h2>
          <p>
            Your application is now being processed. You will receive updates via:
          </p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '1rem auto' }}>
            <li>Email notifications</li>
            <li>SMS updates</li>
            <li>Phone calls for document verification</li>
          </ul>
          
          <button 
            onClick={() => {
              setShowSuccess(false);
              setSubmissionResult(null);
              localStorage.removeItem('onboarding-progress');
            }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Start New Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Customer Onboarding</h1>
          <p style={{ color: '#6b7280' }}>
            Complete your account opening process in just a few simple steps
          </p>
        </div>

        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onStepChange={handleStepChange}
          initialData={getSavedProgress()}
        />
      </div>
    </div>
  );
};

export default NewOnboardingPage;