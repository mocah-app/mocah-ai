# Authentication Setup Guide

## Overview
The authentication system has been upgraded with:
- ✅ Google OAuth integration
- ✅ Password reset functionality
- ✅ Updated sign-in/sign-up forms matching the UI design
- ✅ Terms of Service and Privacy Policy pages

## Required Environment Variables

Add these to your `.env` files:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Better Auth
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Email Service (for password reset)
# Configure your email service (Resend, SendGrid, etc.)
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env` file

## Email Service Configuration

The password reset functionality requires an email service. Currently, there's a placeholder in `packages/auth/src/index.ts`.

### Option 1: Using Resend (Recommended)

1. Install Resend:
```bash
pnpm add resend
```

2. Update `packages/auth/src/index.ts`:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

sendResetPassword: async ({ user, url, token }, request) => {
  await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
  });
},
```

3. Add to `.env`:
```env
RESEND_API_KEY=your_resend_api_key
```

### Option 2: Using SendGrid

1. Install SendGrid:
```bash
pnpm add @sendgrid/mail
```

2. Update `packages/auth/src/index.ts`:
```typescript
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

sendResetPassword: async ({ user, url, token }, request) => {
  await sgMail.send({
    to: user.email,
    from: "noreply@yourdomain.com",
    subject: "Reset your password",
    html: `<p>Click the link to reset your password: <a href="${url}">${url}</a></p>`,
  });
},
```

3. Add to `.env`:
```env
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Features Implemented

### Sign In Form
- Email/password authentication
- Google OAuth sign-in button
- Password reset link
- Terms of Service and Privacy Policy links
- "Create an account" button

### Sign Up Form
- Email/password registration
- Google OAuth sign-up button
- Terms of Service and Privacy Policy links
- "Sign in" link for existing users

### Password Reset Flow
- Request password reset page (`/reset-password`)
- Email with reset link (requires email service configuration)
- Reset password page with token validation
- Success confirmation

### Pages Created
- `/login` - Sign in/Sign up page
- `/reset-password` - Password reset flow
- `/terms` - Terms of Service (placeholder)
- `/privacy` - Privacy Policy (placeholder)

## Testing

1. **Email/Password Sign In:**
   - Navigate to `/login`
   - Enter email and password
   - Click "Sign In with Email"

2. **Google OAuth:**
   - Click "Sign In with Google"
   - Complete Google authentication
   - Should redirect to `/dashboard`

3. **Password Reset:**
   - Click "Reset your password" on sign-in page
   - Enter email address
   - Check email for reset link (currently logs to console)
   - Click link and set new password

## Next Steps

1. ✅ Configure Google OAuth credentials
2. ✅ Set up email service for password reset
3. ✅ Add actual Terms of Service content
4. ✅ Add actual Privacy Policy content
5. ✅ Test all authentication flows
6. ✅ Configure email verification if needed

## Notes

- Password reset emails are currently logged to console. Configure an email service before production.
- Google OAuth requires valid credentials in environment variables.
- Terms and Privacy pages are placeholders and need actual content.

