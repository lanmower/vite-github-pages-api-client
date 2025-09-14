# 🚀 Complete Deployment Guide: Vite + GitHub Pages + Google Apps Script

This guide walks you through deploying a complete CORS-enabled integration between a Vite frontend on GitHub Pages and a Google Apps Script API.

## 📋 Pre-Deployment Checklist

- [x] Google Apps Script with CORS headers (`google-apps-script-api.js`)
- [x] Vite frontend with GitHub Pages configuration
- [x] GitHub Actions workflow for automatic deployment
- [x] WFGY Framework integration (v2.0)
- [x] Responsive UI with API testing interface
- [x] Error handling and retry logic

## 🔧 Step 1: Deploy Google Apps Script

### 1.1 Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. Replace default code with contents of `google-apps-script-api.js`
4. Save the project with a descriptive name

### 1.2 Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Configuration:
   - **Execute as**: Me (your-email@gmail.com)
   - **Who has access**: Anyone
4. Click "Deploy"
5. **IMPORTANT**: Copy the Web App URL
   - Format: `https://script.google.com/macros/s/SCRIPT_ID/exec`

### 1.3 Test Google Apps Script

```bash
# Test health endpoint
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec/health"

# Test POST endpoint
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec/submit" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

## 🐙 Step 2: Setup GitHub Repository

### 2.1 Create Repository

1. Create new GitHub repository: `vite-github-pages-api-client`
2. Clone locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/vite-github-pages-api-client.git
   cd vite-github-pages-api-client
   ```

### 2.2 Add Project Files

1. Copy all files from `vite-github-pages/` folder to your repository
2. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/vite-github-pages-api-client/', // Match your repo name
     // ... rest of config
   })
   ```

### 2.3 Configure Package.json

Ensure your `package.json` has the correct repository name and scripts:

```json
{
  "name": "vite-github-pages-api-client",
  "homepage": "https://YOUR_USERNAME.github.io/vite-github-pages-api-client/",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## 🏗️ Step 3: Enable GitHub Pages

### 3.1 Repository Settings

1. Go to repository Settings
2. Navigate to "Pages" section
3. Source: "GitHub Actions"
4. The workflow in `.github/workflows/deploy.yml` will handle deployment

### 3.2 Commit and Push

```bash
git add .
git commit -m "Initial commit: Vite + Google Apps Script integration"
git push origin main
```

### 3.3 Monitor Deployment

1. Go to "Actions" tab in your repository
2. Watch the deployment workflow run
3. Once complete, your site will be available at:
   `https://YOUR_USERNAME.github.io/vite-github-pages-api-client/`

## 🧪 Step 4: Test Integration

### 4.1 Configure API URL

1. Open your deployed GitHub Pages site
2. Enter your Google Apps Script Web App URL
3. Click "Save Configuration"

### 4.2 Test Each Endpoint

1. **Health Check**: Click "Test Health Endpoint"
2. **Data Retrieval**: Click "Get Sample Data"
3. **Form Submission**: Fill form and click "Submit Form"
4. **Data Processing**: Enter JSON and click "Process Data"

### 4.3 Verify CORS Headers

Open browser DevTools (F12) and check:
- Network tab shows successful requests
- No CORS errors in console
- Response headers include `Access-Control-Allow-Origin: *`

## 🔍 Step 5: Production Optimization

### 5.1 Security Hardening

**Google Apps Script (`google-apps-script-api.js`):**

```javascript
// Replace wildcard with specific domain
'Access-Control-Allow-Origin': 'https://YOUR_USERNAME.github.io'
```

### 5.2 Performance Monitoring

**Add to main.js:**

```javascript
// Performance tracking
console.time('API-Response-Time');
const result = await apiClient.healthCheck();
console.timeEnd('API-Response-Time');
```

### 5.3 Custom Domain (Optional)

1. Add `CNAME` file to `/public` directory
2. Configure custom domain in GitHub Pages settings
3. Update CORS headers accordingly

## 📊 WFGY Framework Configuration

The integration includes WFGY v2.0 framework with these settings:

```javascript
const WFGY_CONFIG = {
  core_version: "2.0",
  delta_s_threshold: 0.60,
  api_timeout: 10000,
  retry_attempts: 3,
  cors_mode: 'cors'
};
```

## 🐛 Troubleshooting Guide

### Common Issues

**1. CORS Errors**
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Verify Google Apps Script returns `ContentService` with proper headers

**2. 404 on GitHub Pages**
```
Error: Page not found
```
**Solution**: Check `base` path in `vite.config.js` matches repository name

**3. API Timeouts**
```
Error: Request timed out
```
**Solution**: Increase timeout in `WFGY_CONFIG` or check Google Apps Script execution time

**4. Build Failures**
```
Error: Module not found
```
**Solution**: Run `npm install` and verify all dependencies are installed

### Debug Commands

```bash
# Local development
npm run dev

# Build and preview
npm run build && npm run preview

# Check build output
ls -la dist/

# Test API directly
curl -H "Content-Type: text/plain;charset=utf-8" \
     "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

## 🎯 Success Metrics

Your integration is successful when:

- [x] GitHub Pages site loads without errors
- [x] All API endpoints respond successfully
- [x] No CORS errors in browser console
- [x] Form submissions work correctly
- [x] Status indicator shows "Connected"
- [x] Response times < 5 seconds
- [x] Mobile responsive design works

## 📈 Next Steps

1. **Add Authentication**: Implement Google OAuth for user-specific data
2. **Data Persistence**: Connect to Google Sheets for data storage
3. **Rate Limiting**: Implement request throttling in Google Apps Script
4. **Monitoring**: Add error tracking and analytics
5. **Testing**: Add automated end-to-end tests

## 📚 Additional Resources

- [Google Apps Script Limits](https://developers.google.com/apps-script/guides/services/quotas)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Vite Production Build](https://vite.dev/guide/build.html)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**✅ Deployment Complete!** You now have a production-ready integration between Vite, GitHub Pages, and Google Apps Script with full CORS support and WFGY framework integration.