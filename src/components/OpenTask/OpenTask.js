import React, { useState, useEffect } from 'react';
import './OpenTask.css';
import tasklistApi from '../../services/tasklistApi';

const OpenTask = () => {
  const [openTasks, setOpenTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [taskVariables, setTaskVariables] = useState({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeName, setAssigneeName] = useState('');

  const [pendingChanges, setPendingChanges] = useState({}); // Store pending field changes

  // Load open tasks from tasklist backend
  useEffect(() => {
    const loadOpenTasks = async () => {
      setLoading(true);
      try {
        console.log('Loading tasks from tasklist backend...');
        
        // Get open tasks from tasklist API
        const tasks = await tasklistApi.getOpenTasks();
        console.log('Tasks from tasklist API:', tasks);
        
        // Transform tasks to match the expected format
        const openTasksData = tasks.map(task => {
          // Get task variables for customer data
          const variables = task.variables || {};
          
          return {
            id: task.id,
            taskName: task.name || task.taskDefinitionId || 'Manual Review',
            creationDate: (() => {
              // Try to get submission timestamp from userInfo first
              const userInfo = variables.userInfo?.value || {};
              if (userInfo.submissionTimestamp) {
                return new Date(userInfo.submissionTimestamp).toLocaleDateString();
              }
              // Fallback to task creation time
              if (task.creationTime) {
                return new Date(task.creationTime).toLocaleDateString();
              }
              // Last fallback to current date
              return new Date().toLocaleDateString();
            })(),
            creationTime: task.creationTime,
            completionTime: task.completionTime,
            taskStatus: task.assignee ? 'assigned' : 'unassigned',
            assignedTo: task.assignee || null,
            isAssigned: !!task.assignee,
            processInstanceKey: task.processInstanceKey,
            processDefinitionId: task.processDefinitionId,
            processName: task.processName,
            taskDefinitionId: task.taskDefinitionId,
            state: task.state || task.taskState,
            priority: task.priority,
            dueDate: task.dueDate,
            followUpDate: task.followUpDate,
            formKey: task.formKey,
            candidateGroups: task.candidateGroups || [],
            candidateUsers: task.candidateUsers || [],
            sortValues: task.sortValues,
            isFirst: task.isFirst,
            // Customer data from task variables
            customerName: variables.customerName?.value || 
                         variables.fullName?.value || 
                         'Unknown Customer',
            customerData: {
              fullName: variables.fullName?.value || variables.customerName?.value || '',
              dob: variables.dob?.value || '',
              mobile: variables.mobile?.value || '',
              email: variables.email?.value || '',
              occupation: variables.occupation?.value || '',
              income_band: variables.income_band?.value || '',
              pep: variables.pep?.value || false,
              address: variables.address?.value || {},
              product: variables.product?.value || {},
              ids: variables.ids?.value || {}
            },
            // Additional task metadata
            completedSteps: calculateCompletedStepsFromVariables(variables),
            submissionDate: (() => {
              // Try to get submission timestamp from userInfo first
              const userInfo = variables.userInfo?.value || {};
              if (userInfo.submissionTimestamp) {
                return new Date(userInfo.submissionTimestamp).toISOString().split('T')[0];
              }
              // Fallback to task creation time
              if (task.creationTime) {
                return new Date(task.creationTime).toISOString().split('T')[0];
              }
              // Last fallback to current date
              return new Date().toISOString().split('T')[0];
            })(),
            incomeBand: variables.income_band?.value || 'Not specified',
            pep: variables.pep?.value || false
          };
        });
        
        setOpenTasks(openTasksData);
        console.log('Processed open tasks:', openTasksData);
        
      } catch (error) {
        console.error('Error loading open tasks from tasklist:', error);
        addAlert('Error loading tasks from tasklist backend', 'error');
        setOpenTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadOpenTasks();
    
    // Set up polling to refresh tasks periodically
    const interval = setInterval(loadOpenTasks, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Get task status based on workflow and application status
  const getTaskStatus = (workflowStatus, status) => {
    if (workflowStatus === 'manual_review') return 'Manual Review';
    if (status === 'pending_review') return 'Pending Review';
    if (workflowStatus === 'in_progress') return 'In Progress';
    if (status === 'submitted') return 'Submitted';
    return 'Unknown';
  };

  // Calculate completed steps based on available data
  const calculateCompletedSteps = (app) => {
    let steps = 0;
    
    // Check if basic customer info is complete
    if (app.customer?.fullName && app.customer?.email && app.customer?.mobile) {
      steps++;
    }
    
    // Check if address is complete
    if (app.address?.line1 && app.address?.city && app.address?.state) {
      steps++;
    }
    
    // Check if documents are uploaded
    if (app.documents && app.documents.length > 0) {
      steps++;
    }
    
    // Check if product selection is complete
    if (app.product?.desired_account) {
      steps++;
    }
    
    return `${steps}/4`;
  };

  // Calculate completed steps from task variables
  const calculateCompletedStepsFromVariables = (variables) => {
    let steps = 0;
    
    // Check if basic customer info is complete
    if (variables.fullName?.value && variables.email?.value && variables.mobile?.value) {
      steps++;
    }
    
    // Check if address is complete
    const address = variables.address?.value || {};
    if (address.line1 && address.city && address.state) {
      steps++;
    }
    
    // Check if documents are uploaded
    const documents = variables.documents?.value || [];
    if (documents && documents.length > 0) {
      steps++;
    }
    
    // Check if product selection is complete
    const product = variables.product?.value || {};
    if (product.desired_account) {
      steps++;
    }
    
    return `${steps}/4`;
  };

  const addAlert = (message, type = 'info') => {
    const alert = { id: Date.now(), message, type };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  };

  // Load task variables when a task is selected
  const loadTaskVariables = async (taskId) => {
    try {
      console.log('Loading variables for task from backend port 5174:', taskId);
      const variables = await tasklistApi.searchTaskVariables(taskId);
      console.log('Task variables loaded from backend:', variables);
      setTaskVariables(prev => ({
        ...prev,
        [taskId]: variables
      }));
      
      // Show success message when variables are loaded
      addAlert('Task variables loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading task variables from backend:', error);
      addAlert('Failed to load task variables from backend', 'error');
    }
  };

  // Handle task selection and load its variables
  const handleTaskSelection = (task) => {
    // Clear pending changes when switching tasks
    if (selectedTask && selectedTask.id !== task?.id) {
      const currentTaskChanges = Object.values(pendingChanges).filter(change => change.taskId === selectedTask.id);
      if (currentTaskChanges.length > 0) {
        console.log(`Clearing ${currentTaskChanges.length} pending changes for previous task`);
        setPendingChanges(prev => {
          const newChanges = { ...prev };
          Object.keys(newChanges).forEach(key => {
            if (newChanges[key].taskId === selectedTask.id) {
              delete newChanges[key];
            }
          });
          return newChanges;
        });
      }
    }
    
    setSelectedTask(task);
    if (task) {
      // Always load fresh variables from backend when task is selected
      console.log('Task selected, loading variables from backend port 5174...');
      loadTaskVariables(task.id);
    }
  };

  // Get enhanced customer data combining task data and loaded variables
  const getEnhancedCustomerData = (task) => {
    const variables = taskVariables[task.id] || {};
    
    // Check if userInfo exists in variables
    const userInfo = variables.userInfo?.value || {};
    const customer = userInfo.customer || {};
    const address = userInfo.address || {};
    const ids = userInfo.ids || {};
    const product = userInfo.product || {};
    
    return {
      // Customer basic info - prioritize userInfo data
      fullName: customer.fullName || variables.fullName?.value || variables.customerName?.value || task.customerData.fullName || '',
      dob: customer.dob || variables.dob?.value || task.customerData.dob || '',
      email: customer.email || variables.email?.value || task.customerData.email || '',
      mobile: customer.mobile || variables.mobile?.value || task.customerData.mobile || '',
      occupation: customer.occupation || variables.occupation?.value || task.customerData.occupation || '',
      income_band: customer.income_band || variables.income_band?.value || task.customerData.income_band || '',
      pep: customer.pep !== undefined ? customer.pep : (variables.pep?.value || task.customerData.pep || false),
      
      // Address info - prioritize userInfo data
      address: {
        line1: address.line1 || variables.address?.value?.line1 || task.customerData.address?.line1 || '',
        line2: address.line2 || variables.address?.value?.line2 || task.customerData.address?.line2 || '',
        city: address.city || variables.address?.value?.city || task.customerData.address?.city || '',
        state: address.state || variables.address?.value?.state || task.customerData.address?.state || '',
        pin: address.pin || variables.address?.value?.pin || task.customerData.address?.pin || '',
        country: address.country || variables.address?.value?.country || task.customerData.address?.country || ''
      },
      
      // Product info - prioritize userInfo data
      product: {
        desired_account: product.desired_account || variables.product?.value?.desired_account || task.customerData.product?.desired_account || '',
        expected_mab_range: product.expected_mab_range || variables.product?.value?.expected_mab_range || task.customerData.product?.expected_mab_range || ''
      },
      
      // ID info - prioritize userInfo data
      ids: {
        idType: ids.idType || variables.ids?.value?.idType || task.customerData.ids?.idType || '',
        idNumber: ids.idNumber || variables.ids?.value?.idNumber || task.customerData.ids?.idNumber || ''
      },
      
      // Additional userInfo fields
      submissionTimestamp: userInfo.submissionTimestamp || ''
    };
  };

  const handleTaskAction = async (action) => {
    if (!selectedTask) {
      addAlert('No task selected', 'error');
      return;
    }

    // No confirmation needed - proceed directly with the action

    setLoading(true);
    
    try {
      console.log(`${action}ing task:`, selectedTask.id);
      console.log('Selected task details:', selectedTask);

      // Prepare variables to pass when completing the task
      const variables = {
        reviewDecision: action === 'approve' ? 'approved' : 'rejected',
        reviewDate: new Date().toISOString(),
        reviewer: 'Admin User',
        reviewComments: `Task ${action}d via admin interface`
      };

      // Add any pending field changes to the variables
      const taskPendingChanges = Object.values(pendingChanges).filter(change => change.taskId === selectedTask.id);
      console.log('Pending changes for task:', taskPendingChanges);
      
      if (taskPendingChanges.length > 0) {
        taskPendingChanges.forEach(change => {
          variables[change.fieldName] = change.newValue;
        });
        console.log(`Added ${taskPendingChanges.length} pending changes to variables`);
      }

      console.log('Final variables to send with task completion:', variables);
      console.log('Expected request body format:', {
        variables: variables,
        action: "complete"
      });

      // Complete the task with the decision
      addAlert(`${action === 'approve' ? 'Approving' : 'Rejecting'} task...`, 'info');
      
      const completedTask = await tasklistApi.completeTask(selectedTask.id, variables);
      console.log('Task completion result:', completedTask);

      // Update local state - remove the task from open tasks since it's now completed
      setOpenTasks(prev => {
        const updatedTasks = prev.filter(task => task.id !== selectedTask.id);
        console.log(`Removed completed task from list. Remaining tasks: ${updatedTasks.length}`);
        return updatedTasks;
      });
      
      // Clear pending changes for this task
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        Object.keys(newChanges).forEach(key => {
          if (newChanges[key].taskId === selectedTask.id) {
            delete newChanges[key];
          }
        });
        return newChanges;
      });
      
      addAlert(
        `Task ${action === 'approve' ? 'approved' : 'rejected'} successfully! ${taskPendingChanges.length > 0 ? 'All field changes have been saved.' : ''}`, 
        'success'
      );

      // Clear selection since the task is no longer in the list
      setSelectedTask(null);

      // Refresh the task list to ensure we have the latest data
      console.log('Refreshing task list after completion...');
      
    } catch (error) {
      console.error('Error processing task action:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        taskId: selectedTask.id,
        action: action
      });
      
      let errorMessage = `Failed to ${action} task`;
      if (error.message.includes('404')) {
        errorMessage += ': Task not found or already completed';
      } else if (error.message.includes('400')) {
        errorMessage += ': Invalid request data';
      } else if (error.message.includes('500')) {
        errorMessage += ': Server error';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      addAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show assign modal
  const showAssignTaskModal = () => {
    if (!selectedTask) {
      addAlert('No task selected', 'error');
      return;
    }
    setAssigneeName('');
    setShowAssignModal(true);
  };

  // Handle task assignment with assignee name
  const handleTaskAssignment = async (action, assigneeName = null) => {
    if (!selectedTask) {
      addAlert('No task selected', 'error');
      return;
    }

    if (action === 'assign' && !assigneeName) {
      addAlert('Please enter assignee name', 'error');
      return;
    }

    setLoading(true);
    
    try {
      let updatedTask;

      if (action === 'assign') {
        console.log('Assigning task:', selectedTask.id, 'to:', assigneeName);
        console.log('Making API call to assign task...');
        updatedTask = await tasklistApi.assignTask(selectedTask.id, assigneeName);
        console.log('Assignment API call completed:', updatedTask);
      } else {
        console.log('Unassigning task:', selectedTask.id);
        console.log('Making API call to unassign task...');
        updatedTask = await tasklistApi.unassignTask(selectedTask.id);
        console.log('Unassignment API call completed:', updatedTask);
      }

      console.log('Task assignment result:', updatedTask);

      // Update local state
      const newAssignedTo = action === 'assign' ? assigneeName : null;
      setOpenTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { 
              ...task, 
              assignedTo: newAssignedTo,
              isAssigned: !!newAssignedTo,
              taskStatus: newAssignedTo ? 'assigned' : 'unassigned'
            }
          : task
      ));

      // Update selected task
      setSelectedTask(prev => ({
        ...prev,
        assignedTo: newAssignedTo,
        isAssigned: !!newAssignedTo,
        taskStatus: newAssignedTo ? 'assigned' : 'unassigned'
      }));
      
      addAlert(
        `Task ${action === 'assign' ? 'assigned to ' + assigneeName : 'unassigned'} successfully`, 
        'success'
      );

      // Close modal if it was open
      setShowAssignModal(false);
      setAssigneeName('');

    } catch (error) {
      console.error('Error processing task assignment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      let errorMessage = `Failed to ${action} task`;
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      addAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle assign modal confirmation
  const handleAssignConfirm = () => {
    console.log('=== ASSIGN CONFIRM DEBUG ===');
    console.log('Assignee name:', assigneeName);
    console.log('Assignee name trimmed:', assigneeName.trim());
    console.log('Selected task:', selectedTask);
    
    if (assigneeName.trim()) {
      console.log('Calling handleTaskAssignment with:', 'assign', assigneeName.trim());
      handleTaskAssignment('assign', assigneeName.trim());
    } else {
      console.log('No assignee name provided');
      addAlert('Please enter assignee name', 'error');
    }
  };



  const getStatusColor = (status) => {
    // Using CSS variables for consistent theming
    const root = document.documentElement;
    const getVar = (varName) => getComputedStyle(root).getPropertyValue(varName).trim();
    
    switch (status?.toLowerCase()) {
      case 'created': return getVar('--color-info');
      case 'assigned': return getVar('--color-warning');
      case 'unassigned': return getVar('--color-warning-alt');
      case 'completed': return getVar('--color-success');
      case 'canceled': return getVar('--color-danger');
      // Legacy statuses for backward compatibility
      case 'submitted': return getVar('--color-info');
      case 'in_progress': return getVar('--color-warning');
      case 'pending_review': return getVar('--color-warning-alt');
      case 'manual_review': return getVar('--color-danger');
      default: return getVar('--color-secondary');
    }
  };



  // Handle field value change - store locally without saving
  const handleFieldChange = (taskId, fieldName, newValue) => {
    // Store the change in pending changes
    const changeKey = `${taskId}_${fieldName}`;
    setPendingChanges(prev => ({
      ...prev,
      [changeKey]: { taskId, fieldName, newValue }
    }));

    // Update the task variables immediately for UI responsiveness
    setTaskVariables(prev => ({
      ...prev,
      [taskId]: prev[taskId].map(variable => 
        variable.name === fieldName 
          ? { ...variable, value: newValue }
          : variable
      )
    }));
  };







  return (
    <div className="open-task-container">
      <h1 className="page-title">All open tasks</h1>

      {alerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      ))}

      <div className="task-layout">
        {/* Tasks List */}
        <div className="tasks-panel panel">
          <div className="tasks-header flex-header">
            <h2>All open tasks</h2>
            <div className="sort-icon">⇅</div>
          </div>
          
          <div className="tasks-list">
            {loading ? (
              <div className="loading-tasks empty-state">
                <div className="loading-spinner">⏳</div>
                <h3>Loading tasks...</h3>
                <p>Please wait while we fetch your open tasks.</p>
              </div>
            ) : openTasks.length === 0 ? (
              <div className="no-tasks empty-state">
                <div className="no-tasks-icon">🔍</div>
                <h3>No tasks found</h3>
                <p>There are no tasks matching your filter criteria.</p>
              </div>
            ) : (
              openTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-card ${selectedTask?.id === task.id ? 'selected' : ''}`}
                  onClick={() => handleTaskSelection(task)}
                >
                  <div className="task-header">
                    <h3>{task.taskName}</h3>
                  </div>
                  <div className="task-details">
                    <div className="task-detail-row">
                      <span className="detail-label">Creation Date:</span>
                      <span className="detail-value">{task.creationDate}</span>
                    </div>
                    <div className="task-detail-row">
                      <span className="detail-label">Task Status:</span>
                      <span className="detail-value">{task.taskStatus}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Details Panel */}
        <div className="task-details-panel panel">
          {selectedTask ? (
            <>
              <div className="task-details-header flex-header">
                <h2>Task Details: </h2>

                {/* <h2>Task Details: {selectedTask.customerName}</h2> */}
                <div className="task-assignment-controls">
                  {selectedTask.isAssigned ? (
                    <>
                      <span className="assigned-to">Assigned to: {selectedTask.assignedTo}</span>
                      <button 
                        className="btn btn-secondary unassign-btn btn-base"
                        onClick={() => handleTaskAssignment('unassign')}
                        disabled={loading}
                      >
                        {loading ? 'Unassigning...' : 'Unassign'}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary assign-btn btn-base"
                      onClick={showAssignTaskModal}
                      disabled={loading}
                    >
                      {loading ? 'Assigning...' : 'Assign Task'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="details-sections">
                {/* Loading message while variables are being fetched */}
                {!taskVariables[selectedTask.id] && (
                  <div className="details-section">
                    <h3>Loading Task Information...</h3>
                    <div className="loading-message">
                      <p>Fetching task variables from backend...</p>
                    </div>
                  </div>
                )}

                {/* Customer Information Section - Show First */}
                {taskVariables[selectedTask.id] && taskVariables[selectedTask.id].length > 0 && (
                  <>
                    {/* Extract and display customer information first */}
                    {(() => {
                      const userInfoVariable = taskVariables[selectedTask.id].find(variable => variable.name === 'userInfo');
                      if (userInfoVariable) {
                        try {
                          const userInfo = JSON.parse(userInfoVariable.value);
                          return (
                            <div className="details-section customer-information-section">
                              <h3>Customer Information</h3>
                              <div className="variables-grid">
                                <div className="variable-group">
                                  {/* Customer Details */}
                                  {userInfo.customer && (
                                    <div className="variable-subgroup">
                                      <h5>Personal Details</h5>
                                      {Object.entries(userInfo.customer).map(([key, value]) => (
                                        <div key={key} className="variable-item">
                                          <span className="variable-name">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                          <span className="variable-value">
                                            {key === 'dob' && value ? new Date(value).toLocaleDateString() : 
                                             key === 'pep' ? (value ? 'Yes' : 'No') :
                                             value || 'Not provided'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Address Details */}
                                  {userInfo.address && (
                                    <div className="variable-subgroup">
                                      <h5>Address Details</h5>
                                      {Object.entries(userInfo.address).map(([key, value]) => (
                                        value && (
                                          <div key={key} className="variable-item">
                                            <span className="variable-name">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                            <span className="variable-value">{value}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}

                                  {/* Identity Details */}
                                  {userInfo.ids && (
                                    <div className="variable-subgroup">
                                      <h5>Identity Details</h5>
                                      {Object.entries(userInfo.ids).map(([key, value]) => (
                                        value && (
                                          <div key={key} className="variable-item">
                                            <span className="variable-name">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                            <span className="variable-value">{key === 'idType' ? value.toUpperCase() : value}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}

                                  {/* Product Details */}
                                  {userInfo.product && (
                                    <div className="variable-subgroup">
                                      <h5>Product Details</h5>
                                      {Object.entries(userInfo.product).map(([key, value]) => (
                                        value && (
                                          <div key={key} className="variable-item">
                                            <span className="variable-name">{key.replace(/([A-Z_])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                                            <span className="variable-value">{value}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}

                                  {/* Submission Timestamp */}
                                  {userInfo.submissionTimestamp && (
                                    <div className="variable-subgroup">
                                      <h5>Submission Details</h5>
                                      <div className="variable-item">
                                        <span className="variable-name">Submission Timestamp:</span>
                                        <span className="variable-value">{new Date(userInfo.submissionTimestamp).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      }
                      return null;
                    })()}

                    {/* Task Information Section - Show Second */}
                    <div className="details-section">
                      <h3>Task Information</h3>
                      <div className="info-grid">
                        {taskVariables[selectedTask.id]
                          .filter(variable => {
                            // Filter out specific fields that should not be displayed and userInfo (already shown above)
                            const fieldsToHide = [
                              'pep',
                              'incomeBand',
                              'completedSteps',
                              'documentPath',
                              'currentStep',
                              'nextStep',
                              'pan',
                              'status',
                              'userInfo' // Hide userInfo since it's displayed in customer section
                            ];
                            return !fieldsToHide.includes(variable.name);
                          })
                          .map((variable, index) => {
                            // Regular variables only (userInfo is handled above)
                            let displayValue = variable.value;
                            
                            // Clean up JSON strings
                            if (typeof displayValue === 'string' && displayValue.startsWith('"') && displayValue.endsWith('"')) {
                              displayValue = displayValue.slice(1, -1);
                            }
                            
                            // Parse arrays if they're JSON strings
                            if (variable.name === 'completedSteps' && typeof displayValue === 'string' && displayValue.startsWith('[')) {
                              try {
                                const steps = JSON.parse(displayValue);
                                displayValue = steps.join(', ');
                              } catch (e) {
                                // Keep original value if parsing fails
                              }
                            }
                            
                            const fieldKey = `${selectedTask.id}_${variable.name}`;
                            
                            return (
                              <div key={index}>
                                <strong>{variable.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {displayValue || 'Not set'}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Personal Information - Fallback if no variables loaded */}
                {(!taskVariables[selectedTask.id] || taskVariables[selectedTask.id].length === 0) && (
                  <div className="details-section">
                    <h3>Customer Personal Information</h3>
                    <div className="info-grid">
                      {(() => {
                        const customerData = getEnhancedCustomerData(selectedTask);
                        return (
                          <>
                            {customerData.fullName && (
                              <div><strong>Full Name:</strong> {customerData.fullName}</div>
                            )}
                            {customerData.dob && (
                              <div><strong>Date of Birth:</strong> {new Date(customerData.dob).toLocaleDateString()}</div>
                            )}
                            {customerData.email && (
                              <div><strong>Email:</strong> {customerData.email}</div>
                            )}
                            {customerData.mobile && (
                              <div><strong>Mobile:</strong> {customerData.mobile}</div>
                            )}
                            {customerData.occupation && (
                              <div><strong>Occupation:</strong> {customerData.occupation}</div>
                            )}
                            {customerData.income_band && (
                              <div><strong>Income Band:</strong> {customerData.income_band}</div>
                            )}
                            <div><strong>PEP Status:</strong> {customerData.pep ? 'Yes' : 'No'}</div>
                            {customerData.submissionTimestamp && (
                              <div><strong>Submission Date:</strong> {new Date(customerData.submissionTimestamp).toLocaleString()}</div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}





                {/* Documents */}
                {selectedTask.documents && selectedTask.documents.length > 0 && (
                  <div className="details-section">
                    <h3>Documents ({selectedTask.documents.length})</h3>
                    <div className="documents-list">
                      {selectedTask.documents.map((doc, index) => (
                        <div key={index} className="document-item">
                          <div className="doc-info">
                            <div className="doc-name">{doc.name}</div>
                            <div className="doc-type">{doc.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Status */}
                <div className="details-section">
                  <h3>Task Status</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Current Status:</strong>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(selectedTask.state || selectedTask.taskStatus) }}
                      >
                        {(selectedTask.state || selectedTask.taskStatus || 'Unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <strong>Creation Date:</strong> {selectedTask.creationDate}
                    </div>
                    <div>
                      <strong>Task ID:</strong> {selectedTask.id}
                    </div>
                    {selectedTask.processInstanceKey && (
                      <div>
                        <strong>Process Instance:</strong> {selectedTask.processInstanceKey}
                      </div>
                    )}
                    {selectedTask.taskDefinitionId && (
                      <div>
                        <strong>Task Definition:</strong> {selectedTask.taskDefinitionId}
                      </div>
                    )}
                    {selectedTask.processDefinitionId && (
                      <div>
                        <strong>Process Definition:</strong> {selectedTask.processDefinitionId}
                      </div>
                    )}
                    {selectedTask.processName && (
                      <div>
                        <strong>Process Name:</strong> {selectedTask.processName}
                      </div>
                    )}
                    {/* <div>
                      <strong>Completed Steps:</strong> {selectedTask.completedSteps}
                    </div> */}
                    {selectedTask.priority && (
                      <div>
                        <strong>Priority:</strong> {selectedTask.priority}
                      </div>
                    )}
                    {selectedTask.dueDate && (
                      <div>
                        <strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {selectedTask.followUpDate && (
                      <div>
                        <strong>Follow Up Date:</strong> {new Date(selectedTask.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                    {selectedTask.formKey && (
                      <div>
                        <strong>Form Key:</strong> {selectedTask.formKey}
                      </div>
                    )}
                    {selectedTask.candidateGroups && selectedTask.candidateGroups.length > 0 && (
                      <div>
                        <strong>Candidate Groups:</strong> {selectedTask.candidateGroups.join(', ')}
                      </div>
                    )}
                    {selectedTask.candidateUsers && selectedTask.candidateUsers.length > 0 && (
                      <div>
                        <strong>Candidate Users:</strong> {selectedTask.candidateUsers.join(', ')}
                      </div>
                    )}
                    {selectedTask.creationTime && (
                      <div>
                        <strong>Creation Time:</strong> {new Date(selectedTask.creationTime).toLocaleString()}
                      </div>
                    )}
                    {selectedTask.completionTime && (
                      <div>
                        <strong>Completion Time:</strong> {new Date(selectedTask.completionTime).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>



                {/* Task Actions */}
                <div className="task-actions">
                  {(() => {
                    const taskPendingChanges = Object.values(pendingChanges).filter(change => change.taskId === selectedTask.id);
                    return taskPendingChanges.length > 0 && (
                      <div className="pending-changes-summary">
                        <span className="pending-changes-text">
                          📝 {taskPendingChanges.length} unsaved change{taskPendingChanges.length > 1 ? 's' : ''} - will be saved when you approve or reject
                        </span>
                      </div>
                    );
                  })()}
                  <div className="action-buttons">
                    <button 
                      className="btn btn-approve"
                      onClick={() => handleTaskAction('approve')}
                      disabled={loading}
                    >
                      {loading ? '⏳ Approving...' : '✓ Approve'}
                    </button>
                    <button 
                      className="btn btn-reject"
                      onClick={() => handleTaskAction('reject')}
                      disabled={loading}
                    >
                      {loading ? '⏳ Rejecting...' : '✗ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection empty-state">
              <h2>Select a Task</h2>
              <p>Choose a task from the list to view its details</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Task</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Assign task "{selectedTask?.taskName}" to:</p>
              <input
                type="text"
                className="assignee-input"
                placeholder="Enter assignee name"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAssignConfirm();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAssignConfirm}
                disabled={!assigneeName.trim() || loading}
              >
                {loading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenTask;