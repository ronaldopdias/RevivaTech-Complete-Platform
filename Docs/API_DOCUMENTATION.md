# RevivaTech API Documentation

## 📖 API Overview

The RevivaTech API provides comprehensive endpoints for managing computer repair bookings, analytics, email services, and real-time communications. This documentation covers all available endpoints, authentication, and integration patterns.

## 🚀 Quick Start

### Base URL
- **Development**: `http://localhost:3011`
- **Production**: `https://api.revivatech.co.uk`

### Interactive Documentation
- **Swagger UI**: `http://localhost:3011/api/docs`
- **OpenAPI Spec**: `http://localhost:3011/api/docs.json`

### Authentication
Most endpoints require authentication using JWT tokens:

```bash
# Include in request headers
Authorization: Bearer <your-jwt-token>

# OR use API key for admin endpoints
X-API-Key: <your-api-key>
```

## 📋 API Endpoints Overview

### 🔐 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### 📱 Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### 🖥️ Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `GET /api/devices/categories` - List device categories
- `GET /api/devices/brands` - List device brands

### 💰 Pricing
- `POST /api/pricing/calculate` - Calculate repair pricing
- `GET /api/pricing/rules` - Get pricing rules
- `POST /api/pricing/estimate` - Get repair estimate

### 📧 Email Services
- `GET /api/email/status` - Check email service status
- `POST /api/email/test` - Send test email
- `POST /api/email/booking-confirmation` - Send booking confirmation
- `POST /api/email/status-update` - Send status update email
- `GET /api/email/providers` - Get email provider setup guide

### 📊 Admin Analytics
- `GET /api/admin/analytics/stats` - Dashboard statistics
- `GET /api/admin/analytics/test` - Test database connection
- `GET /api/admin/analytics/queue` - Repair queue data
- `PUT /api/admin/analytics/repair-queue/:id/status` - Update repair status

### 🔄 Real-time (WebSocket)
- `WebSocket /socket.io` - Real-time updates
- Events: `new_booking`, `repair_status_update`, `admin_stats_update`

### 🏥 Health Check
- `GET /health` - Service health status

## 🛠️ Common Use Cases

### 1. Creating a New Booking

```bash
# Step 1: Get device models
curl -X GET "http://localhost:3011/api/devices" \
  -H "Content-Type: application/json"

# Step 2: Calculate pricing
curl -X POST "http://localhost:3011/api/pricing/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceModelId": "macbook-pro-16-m3",
    "repairTypes": ["SCREEN_REPAIR"],
    "urgencyLevel": "STANDARD"
  }'

# Step 3: Create booking
curl -X POST "http://localhost:3011/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceModelId": "macbook-pro-16-m3",
    "repairType": "SCREEN_REPAIR",
    "problemDescription": "Screen cracked after drop",
    "urgencyLevel": "STANDARD",
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+44 7700 900 123"
    }
  }'
```

### 2. Admin Dashboard Data

```bash
# Get comprehensive dashboard statistics
curl -X GET "http://localhost:3011/api/admin/analytics/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get real-time repair queue
curl -X GET "http://localhost:3011/api/admin/analytics/queue" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update repair status
curl -X PUT "http://localhost:3011/api/admin/analytics/repair-queue/booking-123/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "IN_PROGRESS",
    "technician": "tech-sarah-chen",
    "notes": "Started diagnosis process"
  }'
```

### 3. Email Integration

```bash
# Check email service status
curl -X GET "http://localhost:3011/api/email/status"

# Send booking confirmation
curl -X POST "http://localhost:3011/api/email/booking-confirmation" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "customerName": "John Doe",
    "bookingReference": "RT-2025-001",
    "device": {
      "brand": "Apple",
      "model": "MacBook Pro 16\" M3",
      "issues": ["Screen cracked", "Battery draining fast"]
    },
    "service": {
      "type": "Screen Replacement + Battery Replacement",
      "urgency": "Standard",
      "estimatedCost": 449.99,
      "estimatedDays": 3
    }
  }'

# Send status update
curl -X POST "http://localhost:3011/api/email/status-update" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "customerName": "John Doe",
    "bookingReference": "RT-2025-001",
    "status": "in_progress",
    "message": "Your device is currently being repaired by our certified technician.",
    "estimatedCompletion": "2025-07-18"
  }'
```

## 🔄 Real-time Integration

### WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3011', {
  auth: {
    token: 'your-jwt-token',
    role: 'admin' // or 'customer'
  }
});

// Subscribe to events
socket.on('connect', () => {
  console.log('Connected to RevivaTech API');
  socket.emit('subscribe:admin', { userId: 'admin-123' });
});

// Listen for real-time updates
socket.on('new_booking', (data) => {
  console.log('New booking received:', data);
  // Update dashboard with new booking
});

socket.on('repair_status_update', (data) => {
  console.log('Repair status update:', data);
  // Update repair queue in real-time
});

socket.on('admin_stats_update', (data) => {
  console.log('Admin stats update:', data);
  // Update dashboard statistics
});
```

### Admin Dashboard Integration

```javascript
// Real-time dashboard component
const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [repairQueue, setRepairQueue] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Fetch initial data
    fetchDashboardStats();
    fetchRepairQueue();
    
    // Setup WebSocket connection
    const newSocket = io('http://localhost:3011');
    setSocket(newSocket);
    
    // Listen for real-time updates
    newSocket.on('repair_status_update', (data) => {
      setRepairQueue(prev => prev.map(item => 
        item.id === data.bookingId 
          ? { ...item, status: data.newStatus }
          : item
      ));
    });
    
    return () => newSocket.close();
  }, []);

  const fetchDashboardStats = async () => {
    const response = await fetch('/api/admin/analytics/stats');
    const data = await response.json();
    setStats(data.data);
  };

  const updateRepairStatus = async (bookingId, newStatus) => {
    const response = await fetch(`/api/admin/analytics/repair-queue/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      // Real-time update will be handled by WebSocket
      console.log('Status updated successfully');
    }
  };

  return (
    <div>
      <DashboardStats stats={stats} />
      <RepairQueue queue={repairQueue} onStatusUpdate={updateRepairStatus} />
    </div>
  );
};
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2025-07-16T10:49:31.564Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2025-07-16T10:49:31.564Z"
}
```

### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🔒 Security

### Authentication
- JWT tokens for user sessions
- API keys for admin endpoints
- Role-based access control (RBAC)

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable limits per endpoint
- Bypass for authenticated admin users

### Input Validation
- All inputs validated with Joi schemas
- SQL injection prevention
- XSS protection
- CSRF protection

## 📈 Performance

### Caching
- Redis caching for frequently accessed data
- Database query optimization
- Response compression

### Monitoring
- Real-time performance metrics
- Error tracking with Sentry
- Database query monitoring

## 🐛 Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Examples
```json
{
  "success": false,
  "error": "Validation failed",
  "details": "Email address is required",
  "timestamp": "2025-07-16T10:49:31.564Z"
}
```

## 🧪 Testing

### Health Check
```bash
curl -X GET "http://localhost:3011/health"
```

### Database Connection Test
```bash
curl -X GET "http://localhost:3011/api/admin/analytics/test"
```

### Email Service Test
```bash
curl -X GET "http://localhost:3011/api/email/status"
```

## 🚀 Deployment

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=3011
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/revivatech
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### Docker Deployment
```bash
# Build and run
docker-compose up -d

# Health check
docker-compose ps
curl http://localhost:3011/health
```

## 📚 Additional Resources

### Interactive Documentation
- **Swagger UI**: http://localhost:3011/api/docs
- **OpenAPI Spec**: http://localhost:3011/api/docs.json

### Code Examples
- **Frontend Integration**: `/frontend/src/lib/api/`
- **WebSocket Examples**: `/frontend/src/lib/websocket/`
- **Email Templates**: `/backend/services/emailService.js`

### Support
- **Email**: support@revivatech.co.uk
- **Documentation**: https://docs.revivatech.co.uk
- **Status Page**: https://status.revivatech.co.uk

---

*RevivaTech API Documentation v2.0*  
*Last Updated: July 16, 2025*  
*Interactive Documentation: http://localhost:3011/api/docs*