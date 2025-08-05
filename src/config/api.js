// API Configuration
const API_CONFIG = {
  // Base URL for the backend API
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  
  // OCR and Ollama endpoints
  ENDPOINTS: {
    OCR_UPLOAD_AND_MATCH: '/api/ocr/ollama/upload-and-match',
    OCR_EXTRACT_FIELDS: '/api/ocr/extract', // Use the actual endpoint that exists
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // File upload limits
  FILE_LIMITS: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf']
  }
};

export default API_CONFIG;