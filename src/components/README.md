# Customer Onboarding Components Library

This directory contains reusable components for the customer onboarding application. Components are organized by category for easy discovery and usage.

## 📁 Directory Structure

```
components/
├── ui/                     # Reusable UI components
│   ├── forms/             # Form-related components
│   ├── buttons/           # Button components
│   ├── alerts/            # Alert and notification components
│   └── layout/            # Layout components
├── business/              # Business logic components
│   ├── ocr/              # OCR processing components
│   ├── validation/       # Form validation components
│   └── api/              # API integration components
├── features/              # Feature-specific components
│   ├── onboarding/       # Customer onboarding flow
│   └── tasks/            # Task management
└── shared/               # Shared utilities and hooks

```

## 🚀 Quick Start

### Import Components
```javascript
// Import specific components
import { FormInput, SubmitButton } from '../components/ui';
import { OCRProcessor } from '../components/business';
import { OnboardingWizard } from '../components/features';

// Or import from specific categories
import { FormInput } from '../components/ui/forms';
import { PrimaryButton } from '../components/ui/buttons';
```

### Usage Examples
```javascript
// Basic form input
<FormInput
  label="Full Name"
  value={fullName}
  onChange={(value) => setFullName(value)}
  required
/>

// OCR processing
<OCRProcessor
  onTextExtracted={(data) => handleOCRData(data)}
  onError={(error) => handleError(error)}
/>

// Complete onboarding wizard
<OnboardingWizard
  onComplete={(data) => handleSubmit(data)}
  initialData={existingData}
/>
```

## 📋 Component Categories

### UI Components (`/ui`)
- **Forms**: Input fields, dropdowns, file uploads
- **Buttons**: Primary, secondary, loading states
- **Alerts**: Success, error, warning notifications
- **Layout**: Cards, modals, progress indicators

### Business Components (`/business`)
- **OCR**: Document processing and text extraction
- **Validation**: Form validation rules and feedback
- **API**: Service integration and data handling

### Feature Components (`/features`)
- **Onboarding**: Multi-step customer onboarding flow
- **Tasks**: Task management and assignment

## 🔧 Development Guidelines

### Creating New Components
1. Place components in appropriate category folders
2. Include PropTypes for type checking
3. Add JSDoc comments for documentation
4. Export from category index files
5. Update this README with new components

### Component Structure
```javascript
import React from 'react';
import PropTypes from 'prop-types';
import './ComponentName.css';

/**
 * Brief description of what the component does
 * @param {Object} props - Component props
 * @param {string} props.requiredProp - Description of required prop
 * @param {string} [props.optionalProp] - Description of optional prop
 */
const ComponentName = ({ requiredProp, optionalProp = 'default' }) => {
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  requiredProp: PropTypes.string.isRequired,
  optionalProp: PropTypes.string
};

export default ComponentName;
```

## 📖 Documentation

Each component category has its own README with:
- Component list and descriptions
- Usage examples
- Props documentation
- Styling guidelines

## 🎨 Styling

- Components use CSS modules or styled-components
- Follow BEM naming convention for CSS classes
- Use CSS custom properties for theming
- Responsive design principles

## 🧪 Testing

- Unit tests for each component
- Integration tests for complex workflows
- Accessibility testing
- Cross-browser compatibility

## 📦 Exports

All components are exported through index files for clean imports:
- `/ui/index.js` - All UI components
- `/business/index.js` - All business logic components
- `/features/index.js` - All feature components
- `/index.js` - Main component library export