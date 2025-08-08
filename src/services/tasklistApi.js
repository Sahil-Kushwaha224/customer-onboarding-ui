// API service for interacting with the tasklist backend on port 5174
const TASKLIST_BASE_URL = 'http://localhost:5174';

class TasklistApiService {
  
  /**
   * Search for tasks using the tasklist backend
   * @param {Object} filter - Task search filter
   * @returns {Promise<Array>} Array of tasks
   */
  async searchTasks(filter = {}) {
    try {
      const response = await fetch(`${TASKLIST_BASE_URL}/tasklist/tasks/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task details
   */
  async getTaskById(taskId) {
    try {
      const response = await fetch(`${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  /**
   * Assign a task to a user
   * @param {string} taskId - Task ID
   * @param {string} assignee - User to assign the task to
   * @param {boolean} allowOverrideAssignment - Whether to allow overriding existing assignment
   * @returns {Promise<Object>} Updated task
   */
  async assignTask(taskId, assignee, allowOverrideAssignment = true) {
    try {
      const url = `${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}/assign`;
      const requestBody = {
        assignee,
        allowOverrideAssignment
      };
      
      console.log('Making assignment request to:', url);
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Assignment response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Assignment failed with response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Backend returns plain text "Task assigned successfully.", not JSON
      const responseText = await response.text();
      console.log('Assignment successful, response:', responseText);
      return { message: responseText, success: true };
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  /**
   * Unassign a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task
   */
  async unassignTask(taskId) {
    try {
      const url = `${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}/unassign`;
      
      console.log('Making unassignment request to:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Unassignment response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Unassignment failed with response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Backend returns plain text "Task unassigned successfully.", not JSON
      const responseText = await response.text();
      console.log('Unassignment successful, response:', responseText);
      
      // Fetch the updated task to return consistent data structure
      try {
        const updatedTask = await this.getTaskById(taskId);
        console.log('Fetched updated task after unassignment:', updatedTask);
        return updatedTask;
      } catch (fetchError) {
        console.log('Could not fetch updated task, returning success message:', fetchError.message);
        return { message: responseText, success: true };
      }
    } catch (error) {
      console.error('Error unassigning task:', error);
      throw error;
    }
  }



  /**
   * Complete a task with optional variables
   * @param {string} taskId - Task ID
   * @param {Object} variables - Variables to pass when completing the task (key-value pairs)
   * @returns {Promise<Object>} Completed task
   */
  async completeTask(taskId, variables = {}) {
    try {
      const url = `${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}/complete`;
      const requestBody = { 
        variables: variables,
        action: "complete"
      };
      
      console.log('Making task completion request to:', url);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Task completion response status:', response.status);
      console.log('Task completion response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Task completion failed with response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Backend returns a simple success message, not JSON
      const responseText = await response.text();
      console.log('Task completion successful, response:', responseText);
      return { message: responseText, success: true };
    } catch (error) {
      console.error('Error completing task:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        taskId: taskId,
        variables: variables
      });
      throw error;
    }
  }

  /**
   * Search task variables
   * @param {string} taskId - Task ID
   * @param {Object} searchRequest - Search variables request
   * @returns {Promise<Object>} Task variables
   */
  async searchTaskVariables(taskId, searchRequest = {}) {
    try {
      const response = await fetch(`${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}/variables/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching task variables:', error);
      throw error;
    }
  }

  /**
   * Update task variables
   * @param {string} taskId - Task ID
   * @param {Array} variables - Array of variables to update
   * @returns {Promise<Object>} Update result
   */
  async updateTaskVariables(taskId, variables) {
    try {
      const url = `${TASKLIST_BASE_URL}/tasklist/tasks/${taskId}/variables`;
      
      // Convert array of variables to map format expected by CompleteTaskRequest
      const variablesMap = {};
      variables.forEach(variable => {
        variablesMap[variable.name] = variable.value;
      });
      
      const requestBody = { 
        variables: variablesMap,
        action: "update" // Indicate this is an update, not completion
      };
      
      console.log('Making update variables request to:', url);
      console.log('Variables array:', variables);
      console.log('Variables map:', variablesMap);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Update variables response status:', response.status);
      console.log('Update variables response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update variables failed with response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Update variables successful, response data:', data);
      return data;
    } catch (error) {
      console.error('Error updating task variables:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Get open tasks (tasks that are not completed)
   * @returns {Promise<Array>} Array of open tasks
   */
  async getOpenTasks() {
    const filter = {
      state: 'CREATED', // Only get created/active tasks
      pageSize: 100 // Adjust as needed
    };
    
    return this.searchTasks(filter);
  }

  /**
   * Get unassigned tasks
   * @returns {Promise<Array>} Array of unassigned tasks
   */
  async getUnassignedTasks() {
    const filter = {
      state: 'CREATED',
      assigned: false,
      pageSize: 100
    };
    
    return this.searchTasks(filter);
  }

  /**
   * Get tasks assigned to a specific user
   * @param {string} assignee - User to get tasks for
   * @returns {Promise<Array>} Array of assigned tasks
   */
  async getTasksAssignedTo(assignee) {
    const filter = {
      state: 'CREATED',
      assignee: assignee,
      pageSize: 100
    };
    
    return this.searchTasks(filter);
  }
}

// Export a singleton instance
export default new TasklistApiService();