# Component Usage Guide

This guide shows you how to use the reusable components in your customer onboarding application.

## 🚀 Quick Start

### 1. Import Components

```javascript
// Import specific components
import { 
  FormInput, 
  FormSelect, 
  FileUpload, 
  Button, 
  Alert,
  OnboardingWizard,
  TaskManager,
  OCRProcessor 
} from '../components';

// Or import from specific categories
import { FormInput, Button } from '../components/ui';
import { OnboardingWizard } from '../components/features';
import { OCRProcessor } from '../components/business';
```

### 2. Basic Usage Examples

#### Form Components
```javascript
function MyForm() {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('');
  
  const accountOptions = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'current', label: 'Current Account' }
  ];

  return (
    <div>
      <FormInput
        label="Full Name"
        value={name}
        onChange={setName}
        required
      />
      
      <FormSelect
        label="Account Type"
        value={accountType}
        onChange={setAccountType}
        options={accountOptions}
        required
      />
      
      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
}
```

#### File Upload with OCR
```javascript
function DocumentUpload() {
  const [documents, setDocuments] = useState([]);

  const handleFileUpload = (files) => {
    setDocuments(prev => [...prev, ...files]);
  };

  const handleOCRResult = (parsedData) => {
    console.log('Extracted data:', parsedData);
    // Use the parsed data to fill form fields
  };

  return (
    <div>
      <FileUpload
        label="Upload Identity Documents"
        onFileSelect={handleFileUpload}
        acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
        maxSize={5 * 1024 * 1024} // 5MB
        multiple
      />
      
      <OCRProcessor
        onTextExtracted={handleOCRResult}
        onError={(error) => console.error('OCR Error:', error)}
      />
    </div>
  );
}
```

#### Complete Onboarding Wizard
```javascript
function CustomerOnboardingPage() {
  const handleOnboardingComplete = async (formData) => {
    try {
      // Submit to your backend
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        console.log('Onboarding completed successfully');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      throw error; // Re-throw to show error in wizard
    }
  };

  const handleStepChange = (step, data) => {
    console.log(`Step ${step} completed with data:`, data);
  };

  return (
    <OnboardingWizard
      onComplete={handleOnboardingComplete}
      onStepChange={handleStepChange}
      initialData={{
        customer: { fullName: 'John Doe' } // Pre-fill if needed
      }}
    />
  );
}
```

#### Task Management
```javascript
function TaskManagementPage() {
  const handleTaskSelect = (task) => {
    console.log('Selected task:', task);
  };

  const handleTaskUpdate = (task, action) => {
    console.log(`Task ${task.id} was ${action}`);
  };

  return (
    <TaskManager
      onTaskSelect={handleTaskSelect}
      onTaskUpdate={handleTaskUpdate}
      autoRefresh={true}
      refreshInterval={30000} // 30 seconds
    />
  );
}
```

## 📋 Component Reference

### UI Components

#### FormInput
```javascript
<FormInput
  label="Field Label"           // string - Field label
  value={value}                 // string - Current value
  onChange={setValue}           // function - Change handler
  type="text"                   // string - Input type (text, email, tel, etc.)
  placeholder="Enter value"     // string - Placeholder text
  required={true}               // boolean - Required field
  disabled={false}              // boolean - Disabled state
  error="Error message"         // string - Error message to display
/>
```

#### FormSelect
```javascript
<FormSelect
  label="Select Option"
  value={selectedValue}
  onChange={setSelectedValue}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  placeholder="Choose an option"
  required={true}
  error="Please select an option"
/>
```

#### FileUpload
```javascript
<FileUpload
  label="Upload Files"
  onFileSelect={(files) => console.log(files)}
  acceptedTypes={['.pdf', '.jpg', '.png']}
  maxSize={5 * 1024 * 1024}    // 5MB
  multiple={true}
  disabled={false}
  error="Upload failed"
/>
```

#### Button
```javascript
<Button
  variant="primary"             // primary, secondary, outline, ghost, danger
  size="medium"                 // small, medium, large
  onClick={handleClick}
  disabled={false}
  loading={false}
  type="button"                 // button, submit, reset
  leftIcon={<IconComponent />}
  rightIcon={<IconComponent />}
>
  Button Text
</Button>
```

#### Alert
```javascript
<Alert
  type="success"                // success, error, warning, info
  title="Success!"
  dismissible={true}
  onDismiss={() => setShowAlert(false)}
  icon={<CustomIcon />}
>
  Alert message content
</Alert>
```

### Business Components

#### OCRProcessor
```javascript
<OCRProcessor
  onTextExtracted={(data) => {
    // data contains: { fullName, dob, idType, idNumber, address, rawText }
    console.log('Parsed data:', data);
  }}
  onError={(error) => console.error('OCR failed:', error)}
  onProcessingStart={() => setProcessing(true)}
  onProcessingEnd={() => setProcessing(false)}
  autoProcess={true}            // Auto-process uploaded files
/>
```

### Feature Components

#### OnboardingWizard
```javascript
<OnboardingWizard
  onComplete={async (data) => {
    // Handle form submission
    await submitToBackend(data);
  }}
  initialData={{
    customer: { fullName: 'Pre-filled name' }
  }}
  onStepChange={(step, data) => {
    console.log(`Step ${step}:`, data);
  }}
  customSteps={[
    { id: 1, title: "Personal Info", status: "active" },
    { id: 2, title: "Documents", status: "pending" },
    { id: 3, title: "Review", status: "pending" }
  ]}
/>
```

#### TaskManager
```javascript
<TaskManager
  onTaskSelect={(task) => {
    // Handle task selection
    setSelectedTask(task);
  }}
  onTaskUpdate={(task, action) => {
    // Handle task updates (assigned, completed, etc.)
    console.log(`Task ${task.id} ${action}`);
  }}
  autoRefresh={true}
  refreshInterval={30000}       // Refresh every 30 seconds
/>
```

## 🎨 Styling and Customization

### CSS Custom Properties
You can customize the appearance by overriding CSS custom properties:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --border-radius: 0.375rem;
  --font-family: 'Inter', sans-serif;
}
```

### Component-Specific Styling
Each component has CSS classes you can override:

```css
/* Customize form inputs */
.form-input {
  border-radius: 0.5rem;
  border-color: #d1d5db;
}

/* Customize buttons */
.btn-primary {
  background-color: #your-brand-color;
}

/* Customize alerts */
.alert-success {
  background-color: #your-success-bg;
}
```

## 🔧 Advanced Usage

### Custom Validation
```javascript
function CustomForm() {
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    if (field === 'email' && !value.includes('@')) {
      newErrors.email = 'Invalid email format';
    } else {
      delete newErrors.email;
    }
    
    setErrors(newErrors);
  };

  return (
    <FormInput
      label="Email"
      value={email}
      onChange={(value) => {
        setEmail(value);
        validateField('email', value);
      }}
      error={errors.email}
      required
    />
  );
}
```

### Conditional Rendering
```javascript
function ConditionalForm() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <FormInput label="Basic Field" value={basic} onChange={setBasic} />
      
      <Button 
        variant="ghost" 
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </Button>
      
      {showAdvanced && (
        <FormInput 
          label="Advanced Field" 
          value={advanced} 
          onChange={setAdvanced} 
        />
      )}
    </div>
  );
}
```

### Integration with State Management
```javascript
// With Redux
import { useSelector, useDispatch } from 'react-redux';

function ReduxForm() {
  const formData = useSelector(state => state.onboarding);
  const dispatch = useDispatch();

  return (
    <OnboardingWizard
      initialData={formData}
      onComplete={(data) => {
        dispatch({ type: 'SUBMIT_ONBOARDING', payload: data });
      }}
      onStepChange={(step, data) => {
        dispatch({ type: 'UPDATE_STEP', payload: { step, data } });
      }}
    />
  );
}
```

## 🧪 Testing

### Unit Testing Components
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '../components';

test('FormInput handles user input', () => {
  const handleChange = jest.fn();
  
  render(
    <FormInput
      label="Test Input"
      value=""
      onChange={handleChange}
    />
  );
  
  const input = screen.getByLabelText('Test Input');
  fireEvent.change(input, { target: { value: 'test value' } });
  
  expect(handleChange).toHaveBeenCalledWith('test value');
});
```

### Integration Testing
```javascript
test('OnboardingWizard completes flow', async () => {
  const handleComplete = jest.fn();
  
  render(<OnboardingWizard onComplete={handleComplete} />);
  
  // Fill out form fields
  fireEvent.change(screen.getByLabelText('Full Name'), {
    target: { value: 'John Doe' }
  });
  
  // Navigate through steps
  fireEvent.click(screen.getByText('Next'));
  
  // Submit form
  fireEvent.click(screen.getByText('Submit Application'));
  
  await waitFor(() => {
    expect(handleComplete).toHaveBeenCalled();
  });
});
```

## 📚 Best Practices

1. **Always handle errors**: Provide error callbacks and display meaningful error messages
2. **Use loading states**: Show loading indicators for async operations
3. **Validate input**: Implement proper form validation
4. **Accessibility**: Components include ARIA attributes, but test with screen readers
5. **Performance**: Use React.memo() for expensive components
6. **Testing**: Write tests for your component integrations

## 🐛 Troubleshooting

### Common Issues

**OCR not working**: Ensure your backend OCR endpoint is running at `/api/ocr/extract`

**Tasks not loading**: Check that your tasklist API is accessible and returns the expected format

**Styling issues**: Make sure you're importing the component CSS files

**TypeScript errors**: Add PropTypes or TypeScript definitions for better type safety

### Getting Help

1. Check the component README files for specific documentation
2. Look at the example implementations in the existing CustomerOnboarding and OpenTask components
3. Review the CSS files for styling customization options
4. Check browser console for error messages and warnings