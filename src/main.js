// Main application entry point with WFGY framework integration
import axios from 'axios';

// WFGY Configuration
const WFGY_CONFIG = {
  core_version: "2.0",
  delta_s_threshold: 0.60,
  api_timeout: 10000,
  retry_attempts: 3,
  cors_mode: 'cors'
};

// API Client Class with CORS handling
class GoogleAppsScriptClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.timeout = WFGY_CONFIG.api_timeout;
    this.retryAttempts = WFGY_CONFIG.retry_attempts;

    // Configure axios instance with CORS-friendly settings
    this.client = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Critical for Google Apps Script CORS
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // Disable credentials for public API
      withCredentials: false
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('Response Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  async makeRequest(method, path = '', data = null, attempt = 1) {
    // Use JSONP for Google Apps Script GET requests to avoid CORS issues
    if (method.toLowerCase() === 'get' && this.baseUrl.includes('script.google.com')) {
      // Try both JSONP and direct fetch approaches
      try {
        return await this.makeDirectFetchRequest(path, data, attempt);
      } catch (error) {
        console.log('Direct fetch failed, trying JSONP fallback...');
        return this.makeJSONPRequest(path, data, attempt);
      }
    }

    try {
      const url = path ? `${this.baseUrl}/${path}` : this.baseUrl;
      const config = { method, url };

      if (data) {
        if (method.toLowerCase() === 'get') {
          config.params = data;
        } else {
          config.data = JSON.stringify(data);
        }
      }

      const response = await this.client.request(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      console.error(`API request failed (attempt ${attempt}):`, error.message);

      // Retry logic for network errors
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        console.log(`Retrying request... (${attempt + 1}/${this.retryAttempts})`);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.makeRequest(method, path, data, attempt + 1);
      }

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        details: error.response?.data || null
      };
    }
  }

  async makeJSONPRequest(path = '', params = {}, attempt = 1) {
    return new Promise((resolve) => {
      try {
        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Build URL with parameters - IMPORTANT: Use original baseUrl, not any redirect URL
        const url = new URL(this.baseUrl);
        if (path) url.searchParams.set('path', path);
        Object.keys(params).forEach(key => {
          url.searchParams.set(key, params[key]);
        });
        url.searchParams.set('callback', callbackName);

        console.log('JSONP Request:', 'GET', url.toString());

        // Create callback function
        window[callbackName] = (data) => {
          console.log('JSONP Response received:', data);
          // Cleanup
          document.head.removeChild(script);
          delete window[callbackName];

          resolve({
            success: true,
            data: data,
            status: 200,
            method: 'JSONP'
          });
        };

        // Create script tag
        const script = document.createElement('script');
        script.src = url.toString();
        script.onerror = () => {
          console.error(`JSONP request failed (attempt ${attempt})`);

          // Cleanup
          document.head.removeChild(script);
          delete window[callbackName];

          // Retry logic
          if (attempt < this.retryAttempts) {
            console.log(`Retrying JSONP request... (${attempt + 1}/${this.retryAttempts})`);
            setTimeout(() => {
              this.makeJSONPRequest(path, params, attempt + 1).then(resolve);
            }, 1000 * attempt);
          } else {
            resolve({
              success: false,
              error: 'JSONP request failed',
              status: 0,
              details: 'Network error or script loading failed'
            });
          }
        };

        // Set timeout for JSONP request
        setTimeout(() => {
          if (window[callbackName]) {
            console.error('JSONP request timed out');
            document.head.removeChild(script);
            delete window[callbackName];

            resolve({
              success: false,
              error: 'Request timed out',
              status: 0,
              details: 'JSONP request exceeded timeout'
            });
          }
        }, this.timeout);

        document.head.appendChild(script);

      } catch (error) {
        console.error('JSONP setup error:', error);
        resolve({
          success: false,
          error: error.message,
          status: 0,
          details: 'JSONP setup failed'
        });
      }
    });
  }

  isRetryableError(error) {
    const retryableStatusCodes = [0, 408, 429, 500, 502, 503, 504];
    const statusCode = error.response?.status || 0;
    return retryableStatusCodes.includes(statusCode) || error.code === 'NETWORK_ERROR';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeDirectFetchRequest(path = '', params = {}, attempt = 1) {
    try {
      // Build URL with parameters
      const url = new URL(this.baseUrl);
      if (path) url.searchParams.set('path', path);
      Object.keys(params).forEach(key => {
        url.searchParams.set(key, params[key]);
      });

      console.log('Direct Fetch Request:', 'GET', url.toString());

      // Try fetch with no-cors mode to bypass CORS restrictions
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      console.log('Direct Fetch Response status:', response.status);
      console.log('Direct Fetch Response type:', response.type);

      if (response.type === 'opaque') {
        // For opaque responses, we can't read the data but we know the request went through
        console.log('⚠️ Opaque response - request succeeded but cannot read data due to CORS');
        return {
          success: false,
          error: 'CORS restriction - response received but cannot read data',
          status: 0,
          details: 'Try JSONP fallback or use a CORS proxy'
        };
      }

      const data = await response.json();
      console.log('Direct Fetch Response data:', data);

      return {
        success: true,
        data: data,
        status: response.status,
        method: 'Direct Fetch'
      };
    } catch (error) {
      console.error(`Direct fetch failed (attempt ${attempt}):`, error.message);
      throw error; // Re-throw to trigger JSONP fallback
    }
  }

  // API method implementations
  async healthCheck() {
    return this.makeRequest('GET', 'health');
  }

  async getData(filters = {}) {
    return this.makeRequest('GET', 'data', filters);
  }

  async submitForm(formData) {
    return this.makeRequest('POST', 'submit', formData);
  }

  async processData(data) {
    return this.makeRequest('POST', 'process', data);
  }
}

// UI Controller Class
class UIController {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.elements = {};
    this.initializeElements();
    this.bindEvents();
    this.updateEnvironmentInfo();
  }

  initializeElements() {
    // Configuration elements
    this.elements.apiUrl = document.getElementById('api-url');
    this.elements.saveConfig = document.getElementById('save-config');

    // Test buttons
    this.elements.healthCheck = document.getElementById('health-check');
    this.elements.getData = document.getElementById('get-data');
    this.elements.submitForm = document.getElementById('submit-form');
    this.elements.processBtn = document.getElementById('process-btn');

    // Result containers
    this.elements.healthResult = document.getElementById('health-result');
    this.elements.dataResult = document.getElementById('data-result');
    this.elements.submitResult = document.getElementById('submit-result');
    this.elements.processResult = document.getElementById('process-result');

    // Status elements
    this.elements.status = document.getElementById('status');
    this.elements.statusText = document.getElementById('status-text');
    this.elements.statusIcon = document.getElementById('status-icon');
    this.elements.corsStatus = document.getElementById('cors-status');

    // Data input
    this.elements.processData = document.getElementById('process-data');
  }

  bindEvents() {
    // Configuration
    this.elements.saveConfig.addEventListener('click', () => this.saveConfiguration());

    // API tests
    this.elements.healthCheck.addEventListener('click', () => this.testHealthCheck());
    this.elements.getData.addEventListener('click', () => this.testGetData());
    this.elements.processBtn.addEventListener('click', () => this.testProcessData());

    // Form submission
    this.elements.submitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.testFormSubmission(e.target);
    });

    // Auto-save URL on change
    this.elements.apiUrl.addEventListener('change', () => this.saveConfiguration());
  }

  saveConfiguration() {
    const url = this.elements.apiUrl.value.trim();
    if (!url) {
      this.showError('Please enter a valid Google Apps Script URL');
      return;
    }

    try {
      new URL(url); // Validate URL format
      this.apiClient.setBaseUrl(url);
      localStorage.setItem('gas-api-url', url);
      this.updateStatus('configured', 'Configuration saved');
      console.log('API URL configured:', url);
    } catch (error) {
      this.showError('Invalid URL format');
    }
  }

  async testHealthCheck() {
    this.setButtonLoading(this.elements.healthCheck, true);
    this.updateStatus('loading', 'Testing health endpoint...');

    const result = await this.apiClient.healthCheck();
    this.displayResult(this.elements.healthResult, result);

    if (result.success) {
      this.updateStatus('connected', 'API is healthy');
      this.elements.corsStatus.textContent = 'Working';
      this.elements.corsStatus.style.color = '#27ae60';
    } else {
      this.updateStatus('error', 'Health check failed');
      this.elements.corsStatus.textContent = 'Error';
      this.elements.corsStatus.style.color = '#e74c3c';
    }

    this.setButtonLoading(this.elements.healthCheck, false);
  }

  async testGetData() {
    this.setButtonLoading(this.elements.getData, true);

    const result = await this.apiClient.getData({ filter: 'sample' });
    this.displayResult(this.elements.dataResult, result);

    this.setButtonLoading(this.elements.getData, false);
  }

  async testFormSubmission(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    this.setButtonLoading(submitBtn, true);

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const result = await this.apiClient.submitForm(data);
    this.displayResult(this.elements.submitResult, result);

    if (result.success) {
      form.reset();
    }

    this.setButtonLoading(submitBtn, false);
  }

  async testProcessData() {
    this.setButtonLoading(this.elements.processBtn, true);

    let data;
    try {
      data = JSON.parse(this.elements.processData.value || '{}');
    } catch (error) {
      this.displayResult(this.elements.processResult, {
        success: false,
        error: 'Invalid JSON format',
        details: error.message
      });
      this.setButtonLoading(this.elements.processBtn, false);
      return;
    }

    const result = await this.apiClient.processData(data);
    this.displayResult(this.elements.processResult, result);

    this.setButtonLoading(this.elements.processBtn, false);
  }

  displayResult(element, result) {
    element.textContent = JSON.stringify(result, null, 2);
    element.scrollTop = 0;
  }

  updateStatus(type, message) {
    this.elements.statusText.textContent = message;
    this.elements.status.className = `status-indicator ${type}`;

    const icons = {
      loading: '⏳',
      connected: '✅',
      error: '❌',
      configured: '🔧'
    };

    this.elements.statusIcon.textContent = icons[type] || '⚪';
  }

  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  showError(message) {
    alert(message); // Replace with better error handling in production
  }

  updateEnvironmentInfo() {
    const envInfo = document.getElementById('env-info');
    const isDev = __DEV__;
    const isProd = __PROD__;
    const isGitHubPages = window.location.hostname.includes('github.io');

    let envText = 'Unknown';
    if (isDev) envText = 'Development';
    else if (isProd && isGitHubPages) envText = 'Production (GitHub Pages)';
    else if (isProd) envText = 'Production';

    envInfo.textContent = envText;
  }

  // Load saved configuration on startup
  loadSavedConfiguration() {
    const savedUrl = localStorage.getItem('gas-api-url');
    if (savedUrl) {
      this.elements.apiUrl.value = savedUrl;
      this.apiClient.setBaseUrl(savedUrl);
      this.updateStatus('configured', 'Loaded saved configuration');
    }
  }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Vite + GitHub Pages + Google Apps Script - Starting...');
  console.log('WFGY Framework Version:', WFGY_CONFIG.core_version);

  // Initialize API client and UI
  const apiClient = new GoogleAppsScriptClient();
  const uiController = new UIController(apiClient);

  // Load any saved configuration
  uiController.loadSavedConfiguration();

  // Global error handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    uiController.updateStatus('error', 'Application error occurred');
  });

  console.log('✅ Application initialized successfully');
});

// Export for debugging
window.WFGY_CONFIG = WFGY_CONFIG;