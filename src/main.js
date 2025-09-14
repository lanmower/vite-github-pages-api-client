// Live Status Chat - WFGY v2.0 Framework Integration
import './style.css'

// API Configuration
const API_CONFIG = {
  version: "1.0.0",
  timeout: 10000,
  retry_attempts: 3,
  cors_mode: 'cors'
};

// Status Chat Client Class with CORS Proxy
class StatusChatClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retry_attempts;
    this.refreshInterval = null;
    this.autoRefreshEnabled = true;
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  async makeJSONPRequest(path = '', params = {}, attempt = 1) {
    return new Promise((resolve) => {
      try {
        // Build target URL with parameters
        const targetUrl = new URL(this.baseUrl);
        if (path) targetUrl.searchParams.set('path', path);
        if (params && typeof params === 'object') {
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
              targetUrl.searchParams.set(key, params[key]);
            }
          });
        }

        console.log('Status Chat API Request:', targetUrl.toString());

        const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');

        // Set timeout
        const timeoutId = setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
          }
          document.head.removeChild(script);
          resolve({
            success: false,
            error: 'Request timeout',
            status: 0,
            details: 'JSONP request timed out'
          });
        }, this.timeout);

        window[callbackName] = function(data) {
          clearTimeout(timeoutId);
          document.head.removeChild(script);
          delete window[callbackName];

          resolve({
            success: true,
            data: data,
            status: 200,
            method: 'JSONP'
          });
        };

        script.onerror = function() {
          clearTimeout(timeoutId);
          if (window[callbackName]) {
            delete window[callbackName];
          }
          document.head.removeChild(script);
          resolve({
            success: false,
            error: 'Network error',
            status: 0,
            details: 'Failed to load JSONP script'
          });
        };

        script.src = targetUrl.toString() + '&callback=' + callbackName;
        document.head.appendChild(script);

      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          status: 0,
          details: 'JSONP request setup failed'
        });
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API method implementations for status chat
  async getStatuses() {
    return this.makeJSONPRequest('statuses');
  }

  async updateStatus(name, status) {
    return this.makeJSONPRequest('update-status', {
      name: name,
      status: status,
      timestamp: new Date().toISOString()
    });
  }

  async healthCheck() {
    return this.makeJSONPRequest('health');
  }
}

// Status Chat UI Controller
class StatusChatUI {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.elements = {};
    this.initializeElements();
    this.bindEvents();
    this.loadConfiguration();
    this.startApp();
  }

  initializeElements() {
    // User input elements
    this.elements.username = document.getElementById('username');
    this.elements.userStatus = document.getElementById('user-status');
    this.elements.updateStatusBtn = document.getElementById('update-status');

    // Status feed elements
    this.elements.statusList = document.getElementById('status-list');
    this.elements.refreshBtn = document.getElementById('refresh-btn');
    this.elements.lastUpdated = document.getElementById('last-updated');
    this.elements.userCount = document.getElementById('user-count');

    // Configuration elements
    this.elements.apiUrl = document.getElementById('api-url');
    this.elements.saveConfig = document.getElementById('save-config');

    // Status elements
    this.elements.statusText = document.getElementById('status-text');
    this.elements.statusIcon = document.getElementById('status-icon');
    this.elements.autoRefreshStatus = document.getElementById('auto-refresh-status');
  }

  bindEvents() {
    // User input events
    this.elements.updateStatusBtn.addEventListener('click', () => this.updateUserStatus());
    this.elements.userStatus.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.updateUserStatus();
    });

    // Refresh events
    this.elements.refreshBtn.addEventListener('click', () => this.refreshStatuses());

    // Configuration events
    this.elements.saveConfig.addEventListener('click', () => this.saveConfiguration());
    this.elements.apiUrl.addEventListener('change', () => this.saveConfiguration());

    // Auto-save username and status
    this.elements.username.addEventListener('change', () => this.saveUserData());
    this.elements.userStatus.addEventListener('change', () => this.saveUserData());
  }

  async startApp() {
    this.updateConnectionStatus('connecting', 'Connecting to chat server...');

    // Check API health
    const healthResult = await this.apiClient.healthCheck();

    if (healthResult.success) {
      this.updateConnectionStatus('connected', 'Connected to chat server');
      this.loadUserData();
      this.startAutoRefresh();
      this.refreshStatuses();
    } else {
      this.updateConnectionStatus('error', 'Failed to connect to chat server');
      this.showEmptyState('Cannot connect to chat server. Check configuration.');
    }
  }

  async updateUserStatus() {
    const name = this.elements.username.value.trim();
    const status = this.elements.userStatus.value.trim();

    if (!name || !status) {
      alert('Please enter both your name and status message.');
      return;
    }

    this.setButtonLoading(this.elements.updateStatusBtn, true);

    const result = await this.apiClient.updateStatus(name, status);

    if (result.success) {
      this.saveUserData();
      this.refreshStatuses();
      // Clear status input for next update
      this.elements.userStatus.value = '';
      this.elements.userStatus.focus();
    } else {
      alert('Failed to update status: ' + result.error);
    }

    this.setButtonLoading(this.elements.updateStatusBtn, false);
  }

  async refreshStatuses() {
    this.setButtonLoading(this.elements.refreshBtn, true);

    const result = await this.apiClient.getStatuses();

    if (result.success) {
      this.displayStatuses(result.data);
      this.updateLastRefreshed();
    } else {
      console.error('Failed to refresh statuses:', result.error);
      this.showEmptyState('Failed to load statuses. ' + result.error);
    }

    this.setButtonLoading(this.elements.refreshBtn, false);
  }

  displayStatuses(data) {
    const statuses = data.statuses || [];

    if (statuses.length === 0) {
      this.showEmptyState('No status updates yet. Be the first to share what you\'re up to!');
      return;
    }

    const statusesHTML = statuses.map(status => {
      const timeAgo = this.getTimeAgo(status.timestamp);
      return `
        <div class="status-item">
          <div class="status-user">
            <div class="status-name">${this.escapeHtml(status.name)}</div>
            <div class="status-message">${this.escapeHtml(status.status)}</div>
          </div>
          <div class="status-time">${timeAgo}</div>
        </div>
      `;
    }).join('');

    this.elements.statusList.innerHTML = statusesHTML;
    this.elements.userCount.textContent = `${statuses.length} users online`;
  }

  showEmptyState(message) {
    this.elements.statusList.innerHTML = `
      <div class="empty-message">
        <h3>💭 ${message}</h3>
        <p>Status updates will appear here in real-time.</p>
      </div>
    `;
    this.elements.userCount.textContent = '0 users online';
  }

  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      if (this.autoRefreshEnabled) {
        this.refreshStatuses();
      }
    }, 10000);
  }

  updateLastRefreshed() {
    const now = new Date();
    this.elements.lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  }

  updateConnectionStatus(type, message) {
    this.elements.statusText.textContent = message;

    const icons = {
      connecting: '⏳',
      connected: '✅',
      error: '❌'
    };

    this.elements.statusIcon.textContent = icons[type] || '⚪';
  }

  saveConfiguration() {
    const url = this.elements.apiUrl.value.trim();
    if (!url) {
      alert('Please enter a valid Google Apps Script URL');
      return;
    }

    try {
      new URL(url); // Validate URL format
      this.apiClient.setBaseUrl(url);
      localStorage.setItem('chat-api-url', url);
      console.log('Chat API URL configured:', url);
    } catch (error) {
      alert('Invalid URL format');
    }
  }

  loadConfiguration() {
    const savedUrl = localStorage.getItem('chat-api-url');
    if (savedUrl) {
      this.elements.apiUrl.value = savedUrl;
      this.apiClient.setBaseUrl(savedUrl);
    }
  }

  saveUserData() {
    localStorage.setItem('chat-username', this.elements.username.value);
  }

  loadUserData() {
    const savedUsername = localStorage.getItem('chat-username');
    if (savedUsername) {
      this.elements.username.value = savedUsername;
    }
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

  getTimeAgo(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (error) {
      return 'unknown';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Status Chat - Starting...');
  console.log('API Version:', API_CONFIG.version);

  // Initialize API client and UI
  const defaultApiUrl = 'https://script.google.com/macros/s/AKfycbykbaXGYsA1INdEZUlSy02wJsGwsTdKTtFMoeB8H7c7JPzn81HKs-cu2x8DR_IOtusv-g/exec';
  const apiClient = new StatusChatClient(defaultApiUrl);
  const chatUI = new StatusChatUI(apiClient);

  // Global error handling
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  console.log('✅ Status Chat initialized successfully');
});

// Export for debugging
window.API_CONFIG = API_CONFIG;