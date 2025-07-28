# Claude Code Session Starter Guide
*Quick reference for starting efficient Claude Code sessions*

## 🚀 **ReViva Tech Project Quick Start**

### **Project Details**
- **Project Name**: ReViva Tech
- **Directory**: `/opt/webapps/revivatech`
- **Type**: Professional repair service website with dual-domain setup
- **Current Status**: ~25-30% complete (see CURRENT_IMPLEMENTATION_STATUS.md)

### **Essential First Commands for Every Session**

```bash
# 1. Check project status
cd /opt/webapps
git status
git log --oneline -10

# 2. Read key documentation
cat /opt/webapps/revivatech/CLAUDE.md
cat /opt/webapps/revivatech/COMPREHENSIVE_PRD_IMPLEMENTATION_PLAN.md
cat /opt/webapps/revivatech/CURRENT_IMPLEMENTATION_STATUS.md

# 3. Check project health
cd /opt/webapps/website/frontend-en
npm run lint
npm run typecheck
npm test
```

## 📋 **Session Starter Template for ReViva Tech**

```
Hi Claude, I'm working on ReViva Tech located at /opt/webapps/revivatech.

Please start by:
1. Checking git status and recent commits
2. Reading CLAUDE.md and PRD documentation files
3. Running tests to check current project state

Today's goal: [SPECIFIC OBJECTIVE - e.g., "Implement Phase 1 Week 1 from PRD plan"]

Context: [RELEVANT BACKGROUND - e.g., "Working on device database implementation"]

Please create a todo list and proceed systematically. After each change, run appropriate tests and linting.
```

## 🎯 **Common Session Goals & Templates**

### **1. Continue PRD Implementation**
```
"I'm working on ReViva Tech at /opt/webapps/revivatech. 

Please read COMPREHENSIVE_PRD_IMPLEMENTATION_PLAN.md and continue implementing Phase [X] Week [Y] tasks. Check what's already been completed and proceed with the next logical steps.

Run tests and verify no breaking changes after each implementation."
```

### **2. Bug Fixes**
```
"I'm working on ReViva Tech. There's an issue with [SPECIFIC COMPONENT/PAGE] where [SPECIFIC PROBLEM]. 

Please check the relevant files, identify the root cause, fix it, and run tests to verify the fix."
```

### **3. New Feature Implementation**
```
"I'm working on ReViva Tech. I need to implement [SPECIFIC FEATURE] following the patterns established in the codebase.

Please review existing similar components, implement the feature following those patterns, and update documentation."
```

### **4. Code Review & Optimization**
```
"Review my recent changes in ReViva Tech project. Check git diff, run all tests, optimize any performance issues, and suggest improvements.

Update CLAUDE.md with any new patterns or conventions."
```

## 🔧 **Key Project Files to Reference**

### **Documentation Files**
- `/opt/webapps/revivatech/CLAUDE.md` - Project configuration and status
- `/opt/webapps/revivatech/COMPREHENSIVE_PRD_IMPLEMENTATION_PLAN.md` - 15-week implementation plan
- `/opt/webapps/revivatech/CURRENT_IMPLEMENTATION_STATUS.md` - What's built vs missing
- `/opt/webapps/revivatech/PRD.md` - Original requirements
- `/opt/webapps/revivatech/Docs/Implementation.md` - Detailed implementation stages

### **Key Code Locations**
- `/opt/webapps/website/frontend-en/` - English site (primary)
- `/opt/webapps/website/frontend-pt/` - Portuguese site
- `/opt/webapps/website/backend/` - Backend API
- `/opt/webapps/website/shared/` - Shared components

### **Important Config Files**
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Design system configuration
- `tsconfig.json` - TypeScript configuration

## 🧪 **Testing & Quality Commands**

```bash
# Frontend testing
cd /opt/webapps/website/frontend-en
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm test             # Jest tests
npm run build        # Production build test

# Backend testing
cd /opt/webapps/website/backend
npm test             # Backend tests
npm run lint         # Backend linting
```

## 📊 **Current Project Status Quick Reference**

### **✅ What's Working (25-30% complete)**
- Basic website structure and navigation
- Dual-domain setup (EN/PT)
- Authentication system
- Nordic design system
- Simple admin dashboard
- Basic booking form
- Customer dashboard layout

### **❌ Major Missing Features (70-75% remaining)**
- Advanced multi-step booking wizard
- Device database with pricing calculator
- Real-time communication (Chatwoot)
- WebSocket integration for live updates
- CRM system
- Advanced analytics and BI
- Payment processing
- Mobile PWA features

### **🎯 Next Priority Features (Phase 1)**
1. Device database implementation
2. Multi-step booking wizard
3. Real-time infrastructure (WebSocket)
4. Pricing calculator engine

## 🚨 **Common Issues & Solutions**

### **TypeScript Errors**
```bash
# Check and fix TypeScript issues
npm run typecheck
# Common fixes: import types, update interfaces, check prop types
```

### **Linting Issues**
```bash
# Check and auto-fix linting
npm run lint
npm run lint:fix
```

### **Build Failures**
```bash
# Test production build
npm run build
# Check for missing dependencies, environment variables, or config issues
```

### **Container Issues**
```bash
# Restart Docker containers if needed
cd /opt/webapps/website
docker-compose down
docker-compose up -d
```

## 📝 **Session End Checklist**

Before ending each session, ensure:
- [ ] All tests pass (`npm test`, `npm run lint`, `npm run typecheck`)
- [ ] No TypeScript errors
- [ ] Git status is clean or changes are committed
- [ ] CLAUDE.md updated with new patterns/conventions
- [ ] Documentation updated if new features added
- [ ] Todo list updated with progress and next steps

## 🔗 **Quick Links**

- **Main Project**: `/opt/webapps/revivatech`
- **Frontend**: `/opt/webapps/website/frontend-en`
- **Backend**: `/opt/webapps/website/backend`
- **Documentation**: `/opt/webapps/revivatech/Docs/`
- **This Guide**: `/opt/webapps/revivatech/Docs/CLAUDE_CODE_SESSION_STARTER.md`

## 💡 **Pro Tips for Efficient Sessions**

1. **Always start with project status check** - Prevents working on outdated code
2. **Read documentation first** - Understand current state and goals
3. **Use todo lists** - Keep sessions organized and trackable
4. **Run tests frequently** - Catch issues early
5. **Follow existing patterns** - Maintain code consistency
6. **Update docs** - Help future sessions start faster
7. **Be specific with goals** - Clear objectives = better results
8. **Commit regularly** - Save progress and enable rollbacks

---

*Use this guide at the start of every Claude Code session for maximum efficiency and consistency.*