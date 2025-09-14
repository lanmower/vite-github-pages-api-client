# Vite + GitHub Pages + Google Apps Script Integration

A complete solution for connecting a Vite-powered frontend hosted on GitHub Pages to a Google Apps Script API endpoint with proper CORS handling.

## 🚀 Features

- **Vite Development**: Fast development with Hot Module Replacement
- **GitHub Pages Deployment**: Automatic deployment via GitHub Actions
- **Google Apps Script API**: CORS-enabled backend API
- **WFGY Framework**: Integrated WFGY 2.0 framework for enhanced control
- **Production Ready**: Optimized build with proper error handling
- **Responsive Design**: Mobile-friendly interface
- **Real-time Testing**: Interactive API testing interface

## 📋 Setup Instructions

### 1. Google Apps Script Setup

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the contents of `google-apps-script-api.js` into the script editor
4. Deploy as Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### 2. GitHub Repository Setup

1. Create a new GitHub repository
2. Copy all files from the `vite-github-pages` folder
3. Update `vite.config.js`:
   - Change the `base` path to match your repository name
   - Update the proxy target with your Google Apps Script URL
4. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Select "GitHub Actions" as the source

### 3. Local Development

```bash
# Install dependencies
npm install

# Start development server with proxy
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Deployment

The GitHub Actions workflow will automatically:
- Build the application on every push to main
- Deploy to GitHub Pages
- Handle environment variables and optimization

## 🔧 Configuration

### Environment Variables

The application automatically detects the environment:
- **Development**: Uses Vite proxy for CORS handling
- **Production**: Direct API calls with CORS headers from Google Apps Script

### API Endpoints

The Google Apps Script provides these endpoints:

- `GET /` - API information and health status
- `GET /health` - Health check endpoint
- `GET /data` - Retrieve sample data with optional filtering
- `POST /submit` - Form submission endpoint
- `POST /process` - Data processing endpoint

### CORS Handling

**Development Environment:**
- Vite proxy server handles CORS for development
- Configure proxy in `vite.config.js`

**Production Environment (GitHub Pages):**
- Google Apps Script returns proper CORS headers
- Uses `text/plain;charset=utf-8` Content-Type for compatibility
- All requests are direct to Google Apps Script

## 🏗️ Architecture

### Frontend (Vite + GitHub Pages)
- **Framework**: Vanilla JavaScript with modern ES modules
- **Styling**: Custom CSS with responsive design
- **HTTP Client**: Axios with retry logic and error handling
- **State Management**: Local storage for configuration persistence

### Backend (Google Apps Script)
- **Runtime**: Google Apps Script (Node.js-like environment)
- **API**: RESTful endpoints with doGet/doPost handlers
- **CORS**: Comprehensive CORS header configuration
- **Error Handling**: Structured error responses with proper HTTP codes

### WFGY Framework Integration
- **Version**: 2.0
- **Features**: Delta tracking, error orchestration, configuration management
- **Monitoring**: Real-time status updates and connection monitoring

## 🧪 Testing

### Manual Testing
1. Open the deployed GitHub Pages URL
2. Enter your Google Apps Script Web App URL
3. Test each API endpoint using the interactive interface
4. Monitor the browser console for detailed request/response logs

### API Testing
```javascript
// Health Check
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec/health

// Data Retrieval
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec/data?filter=sample

// Form Submission
POST https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec/submit
Content-Type: text/plain;charset=utf-8
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Test message"
}
```

## 🔒 Security Considerations

- **CORS Policy**: Currently allows all origins (`*`) - restrict in production
- **Input Validation**: Basic sanitization implemented
- **Rate Limiting**: Consider implementing rate limiting in Google Apps Script
- **Data Persistence**: Use Google Sheets or other secure storage for data

## 🐛 Troubleshooting

### Common CORS Issues
- **Error**: "Access-Control-Allow-Origin" missing
  - **Solution**: Ensure Google Apps Script returns ContentService with proper headers

- **Error**: Preflight request fails
  - **Solution**: Implement doGet() method to handle OPTIONS requests

### Development Issues
- **Vite proxy not working**: Check `vite.config.js` proxy configuration
- **Build fails**: Verify all dependencies are installed
- **GitHub Pages 404**: Check repository settings and base path in config

### Production Issues
- **API calls fail**: Verify Google Apps Script deployment and permissions
- **CORS errors**: Check Content-Type header in requests
- **Timeout errors**: Increase timeout in API client configuration

## 📚 Resources

- [Vite Documentation](https://vite.dev/)
- [Google Apps Script Web Apps](https://developers.google.com/apps-script/guides/web)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [WFGY Framework Specification](https://github.com/wfgy-framework)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this code for your projects!

---

**Note**: This integration demonstrates production-ready patterns for connecting static GitHub Pages sites to serverless Google Apps Script APIs with proper CORS handling.