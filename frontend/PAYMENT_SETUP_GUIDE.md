# Payment Setup Guide

This guide will help you configure Stripe and PayPal for the RevivaTech payment system.

## Prerequisites

- RevivaTech application running
- Access to Stripe and PayPal developer accounts

## 1. Stripe Setup

### 1.1 Create a Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create an account or log in
3. Navigate to **Developers > API Keys**

### 1.2 Get Test Keys
1. Toggle to "Test mode" (recommended for development)
2. Copy the **Publishable key** (starts with `pk_test_`)
3. Copy the **Secret key** (starts with `sk_test_`)

### 1.3 Set Up Webhook (Optional)
1. Navigate to **Developers > Webhooks**
2. Click "Add endpoint"
3. Add endpoint URL: `https://your-domain.com/api/payments/stripe/webhooks`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook secret (starts with `whsec_`)

## 2. PayPal Setup

### 2.1 Create a PayPal Developer Account
1. Go to [PayPal Developer](https://developer.paypal.com)
2. Log in with your PayPal account
3. Go to **My Apps & Credentials**

### 2.2 Create a Sandbox Application
1. Click "Create App"
2. Enter app name: "RevivaTech Sandbox"
3. Select "Sandbox" environment
4. Choose "Default Application" merchant account
5. Copy the **Client ID** and **Client Secret**

## 3. Environment Configuration

### 3.1 Update .env.local
Add your credentials to `/opt/webapps/revivatech/frontend/.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY"
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_ACTUAL_WEBHOOK_SECRET"

# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID="YOUR_ACTUAL_PAYPAL_CLIENT_ID"
PAYPAL_CLIENT_SECRET="YOUR_ACTUAL_PAYPAL_CLIENT_SECRET"
PAYPAL_MODE="sandbox"

# Enable real payments
ENABLE_REAL_PAYMENTS="true"
```

### 3.2 Restart the Application
```bash
# Restart the frontend container
docker restart revivatech_new_frontend

# Or if running locally
npm run dev
```

## 4. Testing

### 4.1 Test Cards (Stripe)
- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`
- Use any future date for expiry
- Use any 3-digit CVC

### 4.2 PayPal Sandbox Testing
- Use the sandbox buyer account created in your PayPal Developer account
- Or create a new sandbox account for testing

## 5. Production Setup

### 5.1 Stripe Production
1. Get live keys from Stripe Dashboard (production mode)
2. Update webhook endpoints to production URLs
3. Update environment variables with live keys

### 5.2 PayPal Production
1. Create a live application in PayPal Developer
2. Get live Client ID and Secret
3. Change `PAYPAL_MODE` to "live"

## 6. Security Notes

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor webhook events for security
- Use HTTPS in production
- Validate payment amounts server-side

## 7. Troubleshooting

### Common Issues

**"Stripe not configured" error**:
- Check that `STRIPE_SECRET_KEY` is set in .env.local
- Verify the key starts with `sk_test_` for test mode

**PayPal button not loading**:
- Check that `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
- Verify the client ID is correct
- Check browser console for errors

**Payment amounts don't match**:
- Stripe expects amounts in cents/pence
- PayPal expects amounts in dollars/pounds
- Check currency conversion in code

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL="debug"
```

Check logs:
```bash
docker logs revivatech_new_frontend --tail 50
```

## 8. Support

For issues with:
- **Stripe**: [Stripe Support](https://support.stripe.com)
- **PayPal**: [PayPal Developer Support](https://developer.paypal.com/support)
- **RevivaTech**: Check the application logs and documentation

---

*Last updated: July 2025*