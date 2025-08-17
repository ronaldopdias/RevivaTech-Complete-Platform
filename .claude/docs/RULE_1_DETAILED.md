# RULE 1 METHODOLOGY - Detailed Reference

## 6-Step Process (Saved 16-24 weeks by discovering 90% of backend services)

### **STEP 1: IDENTIFY**
**Discover existing services BEFORE building new ones:**
```bash
# Primary: Use Serena MCP tools for AI-powered discovery
# Fallback: Manual container exploration
docker exec revivatech_backend find /app -name "*.js" -type f | grep -E "(route|service|controller|api)"
docker exec revivatech_backend ls -la /app/routes/ /app/services/
```

### **STEP 2: VERIFY** 
**Test discovered functionality:**
```bash
# Test API endpoints
curl -X GET http://localhost:3011/api/[discovered-endpoint]
# Verify database tables
docker exec revivatech_database psql -U revivatech -d revivatech -c "\dt"
```

### **STEP 3: ANALYZE**
**Compare existing vs required functionality:**
- [ ] Core functionality exists (≥70% of requirements)
- [ ] Database schema and data present
- [ ] API endpoints implemented
- [ ] Service can be mounted/connected
- [ ] Authentication framework exists

### **STEP 4: DECISION**
**Choose integration over recreation:**
- **INTEGRATE** when ≥3 analysis criteria met
- **CREATE NEW** only when no existing functionality found

### **STEP 5: TEST**
**End-to-end integration verification:**
- [ ] Service properly mounted in server.js
- [ ] API endpoints respond correctly
- [ ] Database queries execute successfully
- [ ] Frontend integration working
- [ ] Authentication/authorization functional

### **STEP 6: DOCUMENT**
**Create completion report:**
```markdown
## RULE 1 COMPLETION REPORT
**Task:** [Description]
**Date:** [YYYY-MM-DD]
**Time Saved:** [Estimated weeks]
**Services Found:** [List discovered services]
**Integration Status:** [Success/Issues]
**Next Steps:** [Action items]
```

### **❌ VIOLATIONS RESULT IN:**
- Duplicate work and wasted development time
- Missing existing functionality  
- Incomplete integration breaking systems