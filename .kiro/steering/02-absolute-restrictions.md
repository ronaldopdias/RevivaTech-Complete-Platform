---
inclusion: always
---

# ⛔ ABSOLUTE RESTRICTIONS - NEVER VIOLATE

## 🚫 FORBIDDEN DIRECTORIES AND PROJECTS
**NEVER modify, touch, or reference anything outside `/opt/webapps/revivatech/`:**

❌ **PROHIBITED PATHS:**
- `/opt/webapps/website/` - Website project (Portuguese site)
- `/opt/webapps/CRM/` - CRM project  
- `/opt/webapps/website/backend/` - Website backend
- `/opt/webapps/website/frontend-en/` - Website English frontend
- `/opt/webapps/website/frontend-pt/` - Website Portuguese frontend
- `/opt/webapps/website/shared/` - Website shared components
- `/opt/webapps/website/node_modules/` - Website dependencies
- Any other `/opt/webapps/` subdirectory except `revivatech/`

## 🚫 FORBIDDEN PORTS - NEVER CHANGE
**These ports belong to OTHER PROJECTS and must NEVER be modified:**

❌ **WEBSITE PROJECT PORTS:**
- **5000** - Website backend (`website_backend_dev`)
- **3000** - Website Portuguese frontend (`website_frontend_pt_dev`)  
- **3308** - Website MySQL database (`website_mysql_dev`)
- **6380** - Website Redis cache (`website_redis_dev`)

❌ **CRM PROJECT PORTS:**
- **5001** - CRM backend (`crm_backend_dev`)
- **3001** - CRM frontend (`crm_frontend_dev`)
- **5433** - CRM PostgreSQL database (`crm_postgres_dev`)
- **6381** - CRM Redis cache (`crm_redis_dev`)

## ✅ ALLOWED REVIVATECH PORTS ONLY
**These are the ONLY ports you may use for RevivaTech:**

✅ **REVIVATECH PROJECT PORTS:**
- **3010** - RevivaTech English frontend (`revivatech_new_frontend`)
- **3011** - RevivaTech backend API (`revivatech_new_backend`)
- **5435** - RevivaTech PostgreSQL database (`revivatech_new_database`)
- **6383** - RevivaTech Redis cache (`revivatech_new_redis`)
- **8080-8099** - Development/testing ports (if needed)

**Any other ports require explicit user permission.**

## 🚫 FORBIDDEN ACTIONS
❌ **NEVER DO:**
- Modify any files in `/opt/webapps/website/`
- Change configurations of other projects
- Reference components from other projects  
- Use ports 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381
- Install dependencies in other project directories
- Modify nginx configs for other projects
- Touch Docker containers not related to RevivaTech
- Edit shared libraries outside RevivaTech scope

## 🔍 VALIDATION CHECKLIST
**Before making ANY changes, verify:**

✅ **Path Validation:**
- [ ] Working directory is within `/opt/webapps/revivatech/`
- [ ] No references to `/opt/webapps/website/` or `/opt/webapps/CRM/`
- [ ] All imports are from RevivaTech components only

✅ **Port Validation:**
- [ ] Only using ports 3010, 3011, 5435, 6383, or 8080-8099
- [ ] No configuration changes to ports 3000, 3001, 5000, 5001, 3308, 5433, 6380, 6381

✅ **Container Validation:**
- [ ] Only touching `revivatech_*` containers
- [ ] No modifications to `website_*` or `crm_*` containers

**If ANY validation fails, STOP immediately and ask for clarification.**