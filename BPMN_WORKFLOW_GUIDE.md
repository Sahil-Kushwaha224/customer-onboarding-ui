# Customer Onboarding BPMN Workflow Implementation

This application implements the Customer Onboarding BPMN workflow with the following components:

## BPMN Workflow Components Implemented

### 1. Customer Onboarding Form
- **Location**: `/onboarding`
- **BPMN Step**: Application Submission
- **Features**:
  - Multi-step form (Personal Info → Document Upload → Submit)
  - Validates required fields
  - Simulates AI triage after submission
  - Saves application data to localStorage

### 2. Manual Review Dashboard
- **Location**: `/manual-review` (Admin only)
- **BPMN Step**: Manual Review (User Task)
- **Features**:
  - Shows applications requiring manual review
  - Displays only data provided during onboarding
  - Review decisions: Approve, Reject, Request Additional Documents
  - Updates workflow status based on decision

### 3. Additional Documents Management
- **Location**: `/additional-documents` (Admin only)
- **BPMN Step**: Additional Document Required (User Task)
- **Features**:
  - Manages applications requiring additional documents
  - Add/remove document requests
  - Upload document simulation
  - Document status tracking

### 4. Application Status Tracking
- **Location**: `/application-status`
- **BPMN Step**: Overall workflow monitoring
- **Features**:
  - Real-time status tracking
  - Workflow timeline visualization
  - BPMN step progress indicator
  - Filter and search capabilities

## How to Test the Workflow

### Step 1: Submit an Application
1. Go to `/onboarding`
2. Fill out the customer information form
3. Upload documents (optional)
4. Submit the application
5. The system will simulate AI triage and assign risk level

### Step 2: Manual Review (if required)
1. Switch to "Admin View" in the header
2. Go to `/manual-review`
3. Select an application that requires review
4. Review the customer data (only fields filled during onboarding)
5. Make a decision: Approve, Reject, or Request Additional Documents

### Step 3: Additional Documents (if requested)
1. Go to `/additional-documents`
2. Select an application requiring additional documents
3. Add document requests
4. Simulate document uploads
5. Approve or reject uploaded documents

### Step 4: Track Application Status
1. Go to `/application-status`
2. View all applications and their current status
3. See detailed workflow timeline
4. Monitor BPMN workflow progress

## BPMN Workflow States

The application implements the following BPMN workflow states:

1. **Application Submitted** - Customer completes onboarding form
2. **Initial Triage** - AI agent processes application (simulated)
3. **Decision Gateway**:
   - **Low Risk** → Account Setup → Welcome Notification → Complete
   - **Medium/High Risk** → Verification & Due Diligence:
     - Document Validation
     - KYC Check
     - Manual Review (User Task)
     - Additional Documents Required (User Task)
     - Risk Assessment
4. **Account Setup** - Account creation process
5. **Welcome Notification** - Send credentials to customer
6. **Complete** - Workflow finished

## Data Storage

- Applications are stored in browser localStorage
- Real-time updates across all components
- Admin can clear all data using "Clear Data" button

## User Roles

- **Customer View**: Can access onboarding form and status tracking
- **Admin View**: Can access all components including manual review and document management

## Key Features

- ✅ Only shows data actually provided during onboarding
- ✅ Real-time workflow status updates
- ✅ BPMN-compliant workflow implementation
- ✅ Responsive design for all screen sizes
- ✅ Simulated AI triage with risk assessment
- ✅ Document upload and management
- ✅ Manual review with approval workflow
- ✅ Additional document request system

## Testing Scenarios

1. **Low Risk Application**: Submit with minimal data → Should go directly to Account Setup
2. **High Risk Application**: Submit with PEP status or high income → Should require Manual Review
3. **Additional Documents**: Reject application in manual review → Should appear in Additional Documents
4. **Complete Workflow**: Follow an application from submission to completion

## Notes

- The AI triage is simulated with random risk assignment for demonstration
- Document uploads are simulated (files are not actually stored)
- All workflow decisions update the application status in real-time
- The system follows the exact BPMN workflow provided in the `Customer Onboarding.bpmn` file