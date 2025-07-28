/# Spec-Driven Agentic Development - Quick Start Guide

## 🚀 How to Use This Methodology

This guide will walk you through using the spec-driven development methodology in your projects.

## 📋 The 5-Phase Workflow

```
1. /spec:plan [description]     → Feature List     → [Approval Gate]
2. /spec:requirements [feature] → requirements.md  → [Approval Gate]
3. /spec:design                 → design.md        → [Approval Gate]
4. /spec:tasks                  → tasks.md         → [Approval Gate]
5. /spec:execute [feature]      → Working Code     → [Testing & Deploy]
```

## 🎯 Step-by-Step Example

### Step 1: Planning Your Project
Start by breaking down your project into manageable features:

```
/spec:plan Create a modern todo application with user authentication, 
tagging system, due dates, and email reminders
```

This will:
- Analyze your project description
- Create feature directories
- Generate initial requirements outline
- Ask for approval before proceeding

### Step 2: Define Requirements
For each feature, create detailed EARS-formatted requirements:

```
/spec:requirements user-authentication
```

This generates a `requirements.md` with testable specifications like:
- "WHEN a user submits valid credentials THEN the system SHALL authenticate and create a session"
- "IF a user enters incorrect password 3 times THEN the system SHALL lock the account for 15 minutes"

### Step 3: Technical Design
Create the technical architecture:

```
/spec:design
```

This produces a `design.md` containing:
- System architecture
- API endpoints
- Database schema
- Component interfaces
- Security considerations

### Step 4: Task Breakdown
Generate TDD implementation tasks:

```
/spec:tasks
```

Creates a `tasks.md` with:
- Red-Green-Refactor cycles
- Test scenarios
- Implementation steps
- Acceptance criteria

### Step 5: Implementation
Execute the plan with TDD:

```
/spec:execute user-authentication
```

Choose implementation approach:
- **TDD** (default): Write tests first, then code
- **Standard**: Regular implementation with tests
- **Collaborative**: Work together on implementation
- **Self**: AI implements autonomously

## 📁 Project Structure

After using these commands, your project will have:

```
/opt/webapps/
├── .claude/                      # Methodology files
│   ├── CLAUDE.md                # Main instructions
│   ├── commands/spec/           # All slash commands
│   └── templates/               # Reference templates
├── features/                    # Your specifications
│   ├── user-authentication/
│   │   ├── requirements.md     # EARS requirements
│   │   ├── design.md          # Technical design
│   │   └── tasks.md           # TDD tasks
│   ├── tagging-system/
│   ├── due-dates-reminders/
│   └── email-notifications/
└── [your existing project files]
```

## 🔧 Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/spec:plan` | Break down project | `/spec:plan Build a REST API for user management` |
| `/spec:requirements` | Create EARS specs | `/spec:requirements user-crud-operations` |
| `/spec:design` | Technical design | `/spec:design` |
| `/spec:tasks` | TDD task breakdown | `/spec:tasks` |
| `/spec:execute` | Implement feature | `/spec:execute user-crud-operations` |
| `/spec:advanced` | Enterprise analysis | `/spec:advanced` |
| `/spec:list` | Show all features | `/spec:list` |
| `/spec:status` | Check progress | `/spec:status` |
| `/spec:help` | Detailed help | `/spec:help` |

## 💡 Best Practices

### 1. Start Small
Begin with one feature at a time:
```
/spec:plan Add user login functionality
```

### 2. Review Each Phase
Each phase has an approval gate. Review the output before proceeding:
- ✅ Requirements complete? → Continue to design
- ❌ Need changes? → Modify and regenerate

### 3. Use EARS Format
Requirements should be testable and specific:
- ✅ "WHEN user clicks logout THEN system SHALL terminate session within 100ms"
- ❌ "System should be fast"

### 4. Follow TDD Cycles
Each task follows Red-Green-Refactor:
1. 🔴 Write failing test
2. 🟢 Write minimal code to pass
3. 🔄 Refactor while keeping tests green

### 5. Iterate as Needed
You can go back to any phase:
- Need to change requirements? Run `/spec:requirements [feature]` again
- Design needs update? Run `/spec:design` to regenerate

## 🚦 Quality Gates

Each phase has quality criteria:

### Requirements Gate ✅
- All requirements in EARS format
- Testable and measurable
- Complete coverage of feature

### Design Gate ✅
- Addresses all requirements
- Clear technical approach
- Considers edge cases

### Tasks Gate ✅
- Granular, actionable steps
- Each task has test scenarios
- Clear acceptance criteria

## 🎯 Real-World Example

Let's implement a user authentication feature:

```bash
# 1. Plan the feature
/spec:plan Add secure user authentication with JWT tokens

# 2. Define requirements (after approval)
/spec:requirements user-authentication

# 3. Create technical design (after requirements approval)
/spec:design

# 4. Break down into TDD tasks (after design approval)
/spec:tasks

# 5. Implement with tests (after task approval)
/spec:execute user-authentication
```

## 🆘 Troubleshooting

**Q: Command not recognized?**
A: Ensure `.claude/` directory is in your project root

**Q: Can I modify generated specs?**
A: Yes! Edit the markdown files directly or regenerate with commands

**Q: How to handle multiple features?**
A: Complete one feature through all phases before starting the next

**Q: Can I skip phases?**
A: Not recommended - each phase builds on the previous one

## 🎉 Getting Started

Ready to try it? Start with:

```
/spec:help
```

This will show you all available commands and options.

---

Remember: The methodology is designed to help you build better software through clear specifications and test-driven development. Each phase ensures you're building the right thing, the right way.