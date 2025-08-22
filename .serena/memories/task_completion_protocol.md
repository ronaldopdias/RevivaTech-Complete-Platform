# Task Completion Protocol

## Mandatory Steps for Every Task
1. **Read CLAUDE.md** - Always check project guidelines first
2. **Execute RULE 1 METHODOLOGY** - 6-step systematic process:
   - IDENTIFY: Discover existing services before building new
   - VERIFY: Test discovered functionality  
   - ANALYZE: Compare existing vs required functionality
   - DECISION: Choose integration over recreation
   - TEST: End-to-end integration verification
   - DOCUMENT: Create completion report

## After Code Changes
```bash
# Restart affected containers
docker restart revivatech_frontend  # for frontend changes
docker restart revivatech_backend   # for backend changes

# Clear caches
docker exec revivatech_frontend rm -rf /app/.next /app/node_modules/.cache

# Verify changes live
curl -I http://localhost:3010
curl -I http://localhost:3011/health

# Check logs for errors
docker logs revivatech_frontend --tail 10
docker logs revivatech_backend --tail 10
```

## Quality Checklist
- [ ] Code follows TypeScript strict mode
- [ ] Components use proper variant patterns  
- [ ] No hardcoded Tailscale IPs (100.x.x.x range)
- [ ] API endpoints tested both direct and proxied
- [ ] Database queries tested
- [ ] Authentication flows verified
- [ ] Documentation updated

## Testing Requirements
- Test on localhost:3010 (frontend)
- Test direct backend at localhost:3011
- Verify proxy routing works correctly
- Check database connectivity
- Validate authentication flows
- Ensure proper error handling