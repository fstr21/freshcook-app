# Security Configuration Guide

## 🔵 Supabase Security Settings

### 1. Authentication Settings
Navigate to **Authentication > Settings** in your Supabase dashboard:

#### Email Settings
- ✅ **Enable email confirmations**: Turn ON (prevents fake email signups)
- ✅ **Secure email change**: Turn ON (requires confirmation for email changes)
- ✅ **Double confirm email changes**: Turn ON (extra security layer)

#### Password Settings
- ✅ **Minimum password length**: Set to 8 characters minimum
- ✅ **Password strength**: Enable strong password requirements

#### Session Settings
- ✅ **JWT expiry**: Set to 1 hour (3600 seconds) instead of default 24 hours
- ✅ **Refresh token rotation**: Enable (invalidates old tokens)
- ✅ **Reuse interval**: Set to 10 seconds (prevents token reuse attacks)

#### Security Settings
- ✅ **Enable Captcha**: Turn ON for signup/signin (prevents bots)
- ✅ **Rate limiting**: Configure custom limits:
  - Signup: 5 attempts per hour per IP
  - Signin: 10 attempts per hour per IP
  - Password reset: 3 attempts per hour per IP

### 2. Database Security
Navigate to **Settings > Database**:

#### Connection Security
- ✅ **SSL enforcement**: Ensure "Require SSL" is enabled
- ✅ **Connection pooling**: Enable with reasonable limits (default is fine)

#### Row Level Security
- ✅ **Enable RLS on all tables**: Already configured in your migrations
- ✅ **Review policies**: Ensure they're restrictive and user-specific

### 3. API Settings
Navigate to **Settings > API**:

#### CORS Settings
- ✅ **Allowed origins**: Add your specific domains:
  ```
  https://your-app-name.netlify.app
  https://your-custom-domain.com
  http://localhost:3000 (for development only)
  ```
- ❌ **Remove wildcard (*) origins** in production

#### Rate Limiting
- ✅ **Enable rate limiting**: Set conservative limits:
  - Anonymous requests: 100/hour
  - Authenticated requests: 1000/hour

### 4. Edge Functions Security
Navigate to **Edge Functions**:

#### Environment Variables
- ✅ **Secure API keys**: Ensure GOOGLE_CLOUD_VISION and OPENROUTER_API_KEY are set
- ✅ **No sensitive data in logs**: Review function logs for exposed secrets

## 🟢 Netlify Security Settings

### 1. Site Settings
Navigate to **Site Settings > General**:

#### HTTPS Settings
- ✅ **Force HTTPS**: Enable (redirects HTTP to HTTPS)
- ✅ **HSTS**: Enable HTTP Strict Transport Security
- ✅ **Certificate**: Use Netlify's automatic SSL (Let's Encrypt)

### 2. Security Headers
Navigate to **Site Settings > Build & Deploy > Post processing**:

Create a `_headers` file in your public directory:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://vision.googleapis.com https://openrouter.ai; font-src 'self' data:;

/api/*
  X-Robots-Tag: noindex
```

### 3. Environment Variables
Navigate to **Site Settings > Environment Variables**:

#### Production Variables
- ✅ **VITE_SUPABASE_URL**: Your Supabase project URL
- ✅ **VITE_SUPABASE_ANON_KEY**: Your Supabase anon key
- ❌ **Never add**: Service role keys or private API keys

### 4. Access Control
Navigate to **Site Settings > Access Control**:

#### Visitor Access
- ✅ **Password protection**: Consider for staging environments
- ✅ **Role-based access**: For team members only

### 5. Forms and Functions
Navigate to **Site Settings > Forms**:

#### Spam Protection
- ✅ **Enable Akismet**: For any contact forms
- ✅ **Honeypot**: Enable honeypot fields

## 🔐 Additional Security Measures

### 1. Domain Security
- ✅ **Custom domain**: Use your own domain instead of .netlify.app
- ✅ **DNS security**: Enable DNSSEC if your domain provider supports it

### 2. Monitoring
- ✅ **Set up alerts**: Configure Supabase and Netlify alerts for:
  - Unusual traffic patterns
  - Failed authentication attempts
  - API rate limit violations
  - Error rate spikes

### 3. Regular Security Audits
- ✅ **Monthly reviews**: Check access logs and user activity
- ✅ **Dependency updates**: Keep all packages updated
- ✅ **Security scanning**: Use tools like npm audit

### 4. Backup Strategy
- ✅ **Database backups**: Supabase handles this automatically
- ✅ **Code backups**: Ensure your Git repository is secure
- ✅ **Environment variables**: Keep secure backups of configuration

## 🚨 Critical Security Checklist

Before going to production, ensure:

- [ ] Email confirmation is enabled
- [ ] Strong password requirements are enforced
- [ ] JWT tokens expire within 1 hour
- [ ] Rate limiting is configured
- [ ] CORS is restricted to your domains only
- [ ] HTTPS is forced on Netlify
- [ ] Security headers are configured
- [ ] No sensitive data in client-side code
- [ ] All API keys are server-side only
- [ ] RLS policies are tested and restrictive
- [ ] Monitoring and alerts are set up

## 📞 Emergency Response

If you suspect a security breach:

1. **Immediate**: Revoke all JWT tokens in Supabase
2. **Reset**: Change all API keys and environment variables
3. **Review**: Check access logs for suspicious activity
4. **Notify**: Inform users if personal data may be compromised
5. **Update**: Patch any identified vulnerabilities

Remember: Security is an ongoing process, not a one-time setup!