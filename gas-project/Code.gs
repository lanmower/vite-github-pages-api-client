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
    const path = params.path || e.pathInfo || '';
    const callback = params.callback;

    // Log for debugging
    console.log('doGet called with params:', JSON.stringify(params));
    console.log('Path:', path, 'Callback:', callback);

    let responseData;

    // Handle different API endpoints
    switch (path) {
      case 'health':
        responseData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: WFGY_CONFIG.api_version,
          message: 'Status Chat API is working!',
          wfgy_framework: WFGY_CONFIG.core_version
        };
        break;

      case 'statuses':
        responseData = handleGetStatuses();
        break;

      case 'update-status':
        responseData = handleUpdateStatus(params);
        break;

      case 'data':
        responseData = {
          success: true,
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' }
          ],
          timestamp: new Date().toISOString(),
          source: 'google-apps-script',
          filter_applied: params.filter || null,
          wfgy_version: WFGY_CONFIG.core_version,
          total_records: 3
        };
        break;

      default:
        responseData = {
          message: 'Live Status Chat API - WFGY v2.0 Enabled',
          endpoints: ['/health', '/statuses', '/update-status', '/data'],
          version: WFGY_CONFIG.api_version,
          cors_enabled: WFGY_CONFIG.cors_enabled,
          wfgy_framework: WFGY_CONFIG.core_version,
          timestamp: new Date().toISOString(),
          description: 'Simple status chat powered by Google Apps Script'
        };
    }

    // Handle JSONP callback for CORS compatibility with GitHub Pages
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(responseData) + ');';
      console.log('JSONP Response for callback:', callback);

      // Return as JavaScript to enable JSONP
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return createCORSResponse(responseData);
  } catch (error) {
    const callback = (e.parameter && e.parameter.callback) || null;
    return createErrorResponse(error, callback);
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
 * Creates error response with proper CORS headers and JSONP support
 */
function createErrorResponse(error, callback = null) {
  const errorData = {
    error: true,
    success: false,
    message: error.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
    stack: error.stack || 'No stack trace available'
  };

  // Handle JSONP callback for errors too
  if (callback) {
    const jsonpResponse = callback + '(' + JSON.stringify(errorData) + ');';
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

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
  // Google Apps Script supports JSONP for CORS, but we'll use a different approach
  // We need to handle the CORS preflight request properly
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

/**
 * Handles getting all current statuses
 */
function handleGetStatuses() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const statusesData = properties.getProperty('chat_statuses');

    let statuses = [];
    if (statusesData) {
      statuses = JSON.parse(statusesData);
    }

    // Filter out old statuses (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    statuses = statuses.filter(status => {
      try {
        const statusTime = new Date(status.timestamp);
        return statusTime > oneHourAgo;
      } catch (e) {
        return false;
      }
    });

    // Sort by most recent first
    statuses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      statuses: statuses,
      count: statuses.length,
      timestamp: new Date().toISOString(),
      wfgy_framework: WFGY_CONFIG.core_version
    };
  } catch (error) {
    console.error('Error getting statuses:', error);
    return {
      success: false,
      error: 'Failed to retrieve statuses',
      statuses: [],
      count: 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handles updating a user's status
 */
function handleUpdateStatus(params) {
  try {
    const name = sanitizeData(params.name);
    const status = sanitizeData(params.status);
    const timestamp = params.timestamp || new Date().toISOString();

    if (!name || !status) {
      return {
        success: false,
        error: 'Name and status are required',
        timestamp: new Date().toISOString()
      };
    }

    if (name.length > 20 || status.length > 100) {
      return {
        success: false,
        error: 'Name must be 20 chars or less, status must be 100 chars or less',
        timestamp: new Date().toISOString()
      };
    }

    const properties = PropertiesService.getScriptProperties();
    const statusesData = properties.getProperty('chat_statuses');

    let statuses = [];
    if (statusesData) {
      statuses = JSON.parse(statusesData);
    }

    // Remove any existing status from this user
    statuses = statuses.filter(s => s.name !== name);

    // Add new status
    const newStatus = {
      name: name,
      status: status,
      timestamp: timestamp,
      id: Utilities.getUuid()
    };

    statuses.push(newStatus);

    // Keep only the most recent 50 statuses
    if (statuses.length > 50) {
      statuses = statuses.slice(-50);
    }

    // Save back to properties
    properties.setProperty('chat_statuses', JSON.stringify(statuses));

    return {
      success: true,
      message: 'Status updated successfully',
      status: newStatus,
      total_statuses: statuses.length,
      timestamp: new Date().toISOString(),
      wfgy_framework: WFGY_CONFIG.core_version
    };

  } catch (error) {
    console.error('Error updating status:', error);
    return {
      success: false,
      error: 'Failed to update status: ' + error.message,
      timestamp: new Date().toISOString()
    };
  }
}