/**
 * Google Apps Script API Endpoint with CORS Support
 * Deploy as Web App with "Anyone" access for GitHub Pages integration
 */

// WFGY Framework Integration
const WFGY_CONFIG = {
  core_version: "2.0",
  delta_s_threshold: 0.60,
  cors_enabled: true,
  api_version: "1.0.0"
};

/**
 * Handles GET requests (including preflight OPTIONS requests)
 * Required for proper CORS handling
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const path = e.pathInfo || '';

    // Handle different API endpoints
    switch (path) {
      case 'health':
        return createCORSResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: WFGY_CONFIG.api_version
        });

      case 'data':
        return handleDataRequest(params);

      default:
        return createCORSResponse({
          message: 'API Ready',
          endpoints: ['/health', '/data'],
          version: WFGY_CONFIG.api_version,
          cors_enabled: WFGY_CONFIG.cors_enabled
        });
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Handles POST requests with proper CORS headers
 * Main API endpoint for data operations
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents || '{}');
    const params = e.parameter || {};
    const path = e.pathInfo || '';

    // Log request for debugging
    console.log('POST Request:', { path, postData, params });

    // Handle different POST endpoints
    switch (path) {
      case 'submit':
        return handleSubmitRequest(postData);

      case 'process':
        return handleProcessRequest(postData);

      default:
        return handleGenericPost(postData);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Handles data retrieval requests
 */
function handleDataRequest(params) {
  const sampleData = {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    timestamp: new Date().toISOString(),
    source: 'google-apps-script'
  };

  // Apply filters if provided
  if (params.filter) {
    sampleData.filter_applied = params.filter;
  }

  return createCORSResponse(sampleData);
}

/**
 * Handles form submission requests
 */
function handleSubmitRequest(data) {
  try {
    // Validate required fields
    if (!data.name || !data.email) {
      return createErrorResponse(new Error('Missing required fields: name, email'));
    }

    // Process the submission (example: save to Google Sheet)
    const result = {
      success: true,
      id: Utilities.getUuid(),
      submitted_data: data,
      timestamp: new Date().toISOString(),
      message: 'Data submitted successfully'
    };

    return createCORSResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Handles data processing requests
 */
function handleProcessRequest(data) {
  try {
    // Example processing logic
    const processed = {
      original: data,
      processed_at: new Date().toISOString(),
      processed_data: {
        ...data,
        processed: true,
        hash: Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, JSON.stringify(data))
      }
    };

    return createCORSResponse(processed);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Generic POST handler for unspecified endpoints
 */
function handleGenericPost(data) {
  return createCORSResponse({
    received: data,
    timestamp: new Date().toISOString(),
    message: 'Generic POST request processed'
  });
}

/**
 * Creates a properly formatted CORS response
 * Critical for GitHub Pages integration
 */
function createCORSResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);

  // Add CORS headers for GitHub Pages compatibility
  return addCORSHeaders(output);
}

/**
 * Creates error response with proper CORS headers
 */
function createErrorResponse(error) {
  const errorData = {
    error: true,
    message: error.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
    stack: error.stack || 'No stack trace available'
  };

  const output = ContentService
    .createTextOutput(JSON.stringify(errorData, null, 2))
    .setMimeType(ContentService.MimeType.JSON);

  return addCORSHeaders(output);
}

/**
 * Adds comprehensive CORS headers for cross-origin requests
 * Essential for GitHub Pages integration
 */
function addCORSHeaders(output) {
  // Google Apps Script doesn't support custom headers in ContentService
  // CORS is handled by returning proper JSON content
  // The CORS headers are automatically added by Google Apps Script when deployed as web app with "Anyone" access

  return output;
}

/**
 * Utility function to validate request data
 */
function validateRequest(data, requiredFields = []) {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  return true;
}

/**
 * Utility function to sanitize input data
 */
function sanitizeData(data) {
  if (typeof data === 'string') {
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}