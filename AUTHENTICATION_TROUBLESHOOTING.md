# Authentication Troubleshooting Guide

## Overview

This guide helps resolve authentication issues commonly encountered when deploying the tournament management system to production environments.

## Common Issues and Solutions

### 1. Login Fails with Correct Credentials

**Symptoms:**
- Login form accepts username/password but returns "Invalid credentials" error
- Authentication worked in development but fails in production

**Root Causes:**
- Password hash mismatch between environments
- Database connection issues
- Session store configuration problems

**Solutions:**

1. **Reset Admin Password:**
   - Navigate to Admin Portal → Auth Debug tab
   - Use the Password Reset Tool to set a new password
   - Or use API endpoint: `POST /api/auth/reset-admin-password`

2. **Check System Status:**
   ```bash
   curl -X GET https://your-app.replit.app/api/auth/diagnostic
   ```

### 2. Session Not Persisting (Login Successful but Immediately Logged Out)

**Symptoms:**
- Login succeeds but immediately redirected to login page
- Authentication state doesn't persist between page loads

**Root Causes:**
- Cookie security settings incompatible with hosting environment
- Session store not properly configured
- CORS issues with cross-origin requests

**Solutions:**

1. **Check Cookie Settings:**
   - Ensure `secure: false` for non-HTTPS development
   - Use `sameSite: "lax"` for better compatibility
   - Verify domain settings for production

2. **Verify Session Store:**
   - Confirm `DATABASE_URL` environment variable is set
   - Check PostgreSQL connection in diagnostic endpoint

### 3. CORS/Cross-Origin Issues

**Symptoms:**
- Network errors in browser console
- Authentication requests blocked by CORS policy

**Root Causes:**
- Proxy configuration in production
- Different domains between frontend and backend

**Solutions:**

1. **Trust Proxy Configuration:**
   ```javascript
   proxy: process.env.NODE_ENV === "production"
   ```

2. **Environment Variables:**
   - Ensure `NODE_ENV=production` is set
   - Verify `DATABASE_URL` is configured
   - Check `SESSION_SECRET` is set

## Diagnostic Tools

### API Endpoints

1. **System Diagnostic:**
   ```
   GET /api/auth/diagnostic
   ```
   Returns: user count, admin status, session store type, environment info

2. **Password Reset:**
   ```
   POST /api/auth/reset-admin-password
   Body: { "newPassword": "newpass123", "confirmPassword": "newpass123" }
   ```

3. **Authentication Check:**
   ```
   GET /api/auth/check
   ```
   Returns: current authentication status

### Frontend Tools

1. **Admin Portal → Auth Debug Tab:**
   - Password reset interface
   - System diagnostic button
   - Common issues reference

2. **Browser Developer Console:**
   - Check for network errors
   - Inspect cookie settings
   - Review authentication responses

## Environment-Specific Issues

### Replit Deployment

**Common Problems:**
- Cookie domain mismatches
- HTTPS enforcement issues
- Environment variable access

**Solutions:**
- Use simplified cookie settings
- Disable secure cookies for testing
- Verify environment variables in Replit secrets

### Other Hosting Platforms

**Common Problems:**
- Reverse proxy configurations
- Database connection limits
- Session store cleanup

**Solutions:**
- Configure proxy trust settings
- Use connection pooling
- Implement session cleanup

## Prevention Best Practices

1. **Environment Consistency:**
   - Use same Node.js version across environments
   - Keep dependency versions synchronized
   - Test authentication in staging environment

2. **Monitoring:**
   - Log authentication attempts
   - Monitor session creation/destruction
   - Track database connection health

3. **Security:**
   - Use strong session secrets
   - Implement proper HTTPS in production
   - Regular password rotation

## Step-by-Step Troubleshooting

1. **Verify Basic Connectivity:**
   ```bash
   curl -X GET https://your-app.replit.app/api/auth/diagnostic
   ```

2. **Check User Exists:**
   - Confirm admin user exists in diagnostic response
   - Verify user count is > 0

3. **Test Password Reset:**
   - Use Auth Debug tab or API endpoint
   - Set new 6+ character password
   - Test login immediately after reset

4. **Inspect Session Behavior:**
   - Check browser cookies after login
   - Verify session ID persists
   - Test authentication check endpoint

5. **Review Server Logs:**
   - Look for session save errors
   - Check database connection issues
   - Monitor authentication attempt logs

## Contact Support

If authentication issues persist after following this guide:

1. Collect diagnostic information from `/api/auth/diagnostic`
2. Note specific error messages from browser console
3. Document steps that reproduce the issue
4. Include environment details (hosting platform, domain, etc.)

Remember: Authentication issues are often environment-specific and require careful attention to cookie settings, database connections, and proxy configurations.