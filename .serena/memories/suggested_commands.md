# RevivaTech Development Commands

## Essential Container Commands
```bash
# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep revivatech

# Restart containers after changes
docker restart revivatech_frontend revivatech_backend

# Check logs for issues
docker logs revivatech_frontend --tail 20
docker logs revivatech_backend --tail 20

# Test container connectivity  
docker exec revivatech_frontend wget -qO- http://revivatech_backend:3011/health
```

## API Testing Commands
```bash
# Test frontend access
curl -I http://localhost:3010

# Test backend API health
curl -I http://localhost:3011/health

# Test proxied API through frontend
curl -I http://localhost:3010/api/admin/customers

# Test backend API directly  
curl -I http://localhost:3011/api/admin/customers

# Test Better Auth endpoints
curl -I http://localhost:3011/api/auth/session
```

## Database Commands
```bash
# Check database tables
docker exec revivatech_database psql -U revivatech -d revivatech -c "\dt"

# Check specific table existence
docker exec revivatech_database psql -U revivatech -d revivatech -c "\d users"

# Run database migrations
docker exec revivatech_backend node database/migrations/001_initial_schema.js
```

## Development Workflow
```bash
# After frontend code changes
docker restart revivatech_frontend
docker exec revivatech_frontend rm -rf /app/.next /app/node_modules/.cache

# After backend code changes  
docker restart revivatech_backend

# Clear all caches
docker system prune -f
```

## System Utilities (Linux)
- `grep -r "pattern" directory/` - Search in files
- `find . -name "*.js" -type f` - Find files by pattern
- `ps aux | grep process_name` - Check running processes
- `netstat -tlnp` - Check port usage
- `df -h` - Check disk space
- `docker system df` - Check Docker disk usage