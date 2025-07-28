# CRM Integration Guide

## Overview

This guide documents the integration between RevivaTech and the external CRM system located at `/opt/webapps/CRM`. The integration allows RevivaTech to send customer and booking data to the CRM system for approval and processing.

## Architecture

### Data Flow
```
RevivaTech Events → CRM Webhooks → CRM Approval Queue → CRM Database
```

### Integration Points

#### 1. Customer Registration
- **Trigger**: When a new customer registers on RevivaTech website
- **Endpoint**: `POST /webhooks/customer-registration`
- **Data Sent**: Customer profile information
- **CRM Action**: Adds customer to approval queue

#### 2. Booking Creation
- **Trigger**: When a customer creates a repair booking
- **Endpoint**: `POST /webhooks/repair-request`
- **Data Sent**: Booking details, customer info, device information
- **CRM Action**: Creates repair ticket in approval queue

#### 3. Future Integrations (Planned)
- Payment status notifications
- Customer profile updates
- Booking status changes

## Technical Implementation

### RevivaTech Components

#### Backend Service (`shared/backend/services/crmWebhookService.js`)
- Handles webhook notifications to CRM
- Implements retry logic for failed requests
- Logs failed webhooks for manual processing

#### Frontend Service (`frontend/src/lib/services/crmWebhookService.ts`)
- TypeScript version for Next.js API routes
- Used by booking API endpoints
- Provides type safety for webhook payloads

#### API Endpoints
- `GET /api/crm/integration` - Integration status and health
- `POST /api/crm/integration/test` - Test CRM integration
- `PATCH /api/crm/integration/retry-failed` - Retry failed webhooks

#### Admin Dashboard Component
- `CRMIntegrationStatus.tsx` - Real-time integration monitoring
- Shows connection status, feature availability, statistics
- Provides testing and troubleshooting tools

### CRM System Components (External)

#### Webhook Endpoints (`/opt/webapps/CRM/backend/src/routes/webhooks.ts`)
- `POST /webhooks/customer-registration` - Receive customer data
- `POST /webhooks/repair-request` - Receive booking data
- `GET /webhooks/health` - Health check endpoint

#### Authentication
- Uses Bearer token authentication
- API key configured in environment variables
- Validates requests from RevivaTech only

## Configuration

### Environment Variables

#### RevivaTech Backend (`.env`)
```bash
CRM_WEBHOOK_URL=http://localhost:5001/webhooks
CRM_API_KEY=your-webhook-api-key
```

#### RevivaTech Frontend (`.env.local`)
```bash
CRM_WEBHOOK_URL=http://localhost:5001/webhooks
CRM_API_KEY=your-webhook-api-key
```

#### CRM System (`.env`)
```bash
WEBHOOK_API_KEY=your-webhook-api-key
```

### Network Configuration

#### Port Allocation
- **RevivaTech Frontend**: 3010
- **RevivaTech Backend**: 3011
- **CRM Frontend**: 3001
- **CRM Backend**: 5001

#### Container Communication
- RevivaTech containers: `revivatech-new-network`
- CRM containers: `crm-network`
- Cross-network communication via localhost

## Webhook Payloads

### Customer Registration
```json
{
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+44123456789",
    "websiteUserId": "rev_user_123",
    "registrationDate": "2024-12-13T10:00:00Z",
    "source": "revivatech",
    "language": "en",
    "status": "pending_approval",
    "preferences": {}
  },
  "metadata": {
    "registrationSource": "website",
    "timestamp": "2024-12-13T10:00:00Z"
  }
}
```

### Repair Request
```json
{
  "repair": {
    "ticketNumber": "REV-1234567890",
    "websiteRepairId": "booking_uuid",
    "customerEmail": "john@example.com",
    "customerName": "John Doe",
    "deviceType": "Apple MacBook Pro",
    "deviceModel": "MacBook Pro 16\"",
    "issueDescription": "Screen replacement needed",
    "serviceType": "SCREEN_REPAIR",
    "priority": "normal",
    "language": "en",
    "address": "123 Main Street, London",
    "notes": "Handle with care",
    "createdAt": "2024-12-13T10:00:00Z",
    "estimatedCost": 299.99,
    "photos": ["url1", "url2"]
  },
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+44123456789",
    "websiteUserId": "rev_user_123"
  },
  "metadata": {
    "source": "revivatech",
    "bookingChannel": "website",
    "timestamp": "2024-12-13T10:00:00Z"
  }
}
```

## Error Handling

### Retry Logic
- Maximum 3 retry attempts
- Exponential backoff (1s, 2s, 3s)
- Failed webhooks logged for manual processing

### Error Scenarios
1. **CRM System Down**: Requests fail, retries triggered
2. **Authentication Error**: Invalid API key, requests rejected
3. **Validation Error**: Invalid payload format, requests rejected
4. **Network Timeout**: Connection timeout, retries triggered

### Monitoring
- Integration status dashboard in RevivaTech admin
- Health check endpoint for monitoring
- Failed webhook logging and alerting

## Testing

### Manual Testing
1. Access RevivaTech admin dashboard
2. Navigate to CRM Integration section
3. Click "Test Integration" button
4. Review test results

### Automated Testing
```bash
# Test customer registration webhook
curl -X POST http://localhost:5001/webhooks/customer-registration \
  -H "Authorization: Bearer your-webhook-api-key" \
  -H "Content-Type: application/json" \
  -d '{"customer": {...}, "metadata": {...}}'

# Test repair request webhook
curl -X POST http://localhost:5001/webhooks/repair-request \
  -H "Authorization: Bearer your-webhook-api-key" \
  -H "Content-Type: application/json" \
  -d '{"repair": {...}, "customer": {...}, "metadata": {...}}'

# Health check
curl http://localhost:5001/webhooks/health
```

## Security

### Authentication
- Bearer token authentication for all webhook calls
- API key stored securely in environment variables
- Request validation and sanitization

### Data Protection
- No sensitive data stored in RevivaTech after sending
- CRM system responsible for data security and compliance
- Audit trail maintained in both systems

### Network Security
- Internal network communication only
- No external API exposure for webhooks
- Rate limiting on webhook endpoints

## Troubleshooting

### Common Issues

#### 1. Connection Refused
- **Symptom**: "Connection refused" error in logs
- **Cause**: CRM system not running or wrong port
- **Solution**: Check CRM container status, verify port configuration

#### 2. Authentication Failed
- **Symptom**: 401 Unauthorized responses
- **Cause**: Invalid or missing API key
- **Solution**: Verify API key in both systems' environment variables

#### 3. Webhook Timeouts
- **Symptom**: Timeout errors in webhook calls
- **Cause**: CRM system overloaded or slow response
- **Solution**: Increase timeout, check CRM system performance

#### 4. Validation Errors
- **Symptom**: 400 Bad Request responses
- **Cause**: Invalid payload format or missing required fields
- **Solution**: Check payload structure against expected schema

### Debugging Tools

#### Check Integration Status
```bash
# RevivaTech admin dashboard
http://localhost:3010/admin

# Direct API call
curl http://localhost:3010/api/crm/integration
```

#### View Logs
```bash
# RevivaTech backend logs
docker logs revivatech_new_backend

# CRM backend logs
docker logs crm_backend_dev
```

#### Test Connectivity
```bash
# Test CRM health endpoint
curl http://localhost:5001/webhooks/health

# Test from RevivaTech container
docker exec revivatech_new_backend curl http://localhost:5001/webhooks/health
```

## Maintenance

### Regular Tasks
1. Monitor integration status dashboard
2. Check failed webhook logs weekly
3. Verify API key rotation (quarterly)
4. Review and test disaster recovery procedures

### Updates and Changes
1. Update webhook payloads with versioning
2. Maintain backward compatibility
3. Test integration after any system updates
4. Document all changes in this guide

## Support and Contact

### RevivaTech Team
- Integration logs: RevivaTech backend container
- Admin dashboard: http://localhost:3010/admin
- Configuration: `/opt/webapps/revivatech/`

### CRM Team
- CRM system: http://localhost:3001
- CRM logs: CRM backend container
- Configuration: `/opt/webapps/CRM/`

---

**Last Updated**: December 2024
**Version**: 1.0
**Integration Status**: Active