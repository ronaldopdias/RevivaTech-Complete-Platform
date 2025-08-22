# MCP Usage Guide - Serena & Sequential Thinking

## 🚀 How Serena and Sequential Thinking MCPs Work with Claude

### **📋 Current MCP Status:**
- ✅ **Serena MCP**: Connected and operational
- ✅ **Sequential Thinking MCP**: Connected and operational
- ✅ **Auto-Approval**: Configured for seamless operation

### **⚡ Automatic vs Manual Tool Invocation**

Both MCPs work in **two modes**:

#### **1. 🤖 Automatic Invocation (Recommended)**
Claude **intelligently detects** when tasks need MCP tools and uses them automatically.

**No special commands needed** - just ask naturally!

#### **2. 🎮 Manual Invocation**
You can explicitly request MCP tools when needed.

---

## 🔧 Serena MCP - Semantic Code Analysis

### **🎯 Automatic Triggers**

Serena tools activate automatically when you ask:

#### **Code Discovery & Navigation:**
- **"Find where this function is used"**
- **"Show me all the components that import this module"**
- **"What classes extend this base class?"**
- **"Find all references to this variable"**

#### **Code Analysis & Understanding:**
- **"What does this project structure look like?"**
- **"How is authentication implemented in this codebase?"**
- **"Show me the API endpoints in this service"**
- **"What are the main modules in this project?"**

#### **Refactoring & Editing:**
- **"Rename this function across all files"**
- **"Refactor this class to use a different pattern"**
- **"Update all imports when I move this file"**
- **"Extract this logic into a separate utility function"**

#### **Project Intelligence:**
- **"What have we learned about this project?"**
- **"Remember that this API uses JWT authentication"**
- **"What patterns have we discovered in the codebase?"**
- **"Show me the project memory about database design"**

### **🛠️ Available Serena Tools (30 total):**

**Symbol & Code Analysis:**
- `find_symbol` - Locate function/class definitions
- `find_referencing_symbols` - Find where symbols are used
- `get_symbols_overview` - Get project structure overview
- `replace_symbol_body` - Intelligent code replacement

**File Operations:**
- `read_file` - Semantic file reading
- `create_text_file` - Create new files
- `search_for_pattern` - Advanced pattern matching
- `replace_regex` - Smart regex replacements

**Project Memory:**
- `write_memory` - Store project knowledge
- `read_memory` - Retrieve project insights
- `list_memories` - Show all stored knowledge

**Language Server Integration:**
- `restart_language_server` - Restart LSP for troubleshooting
- TypeScript LSP integration active for RevivaTech project

---

## 🧠 Sequential Thinking MCP - Enhanced Reasoning

### **🎯 Automatic Triggers**

Sequential Thinking activates automatically for:

#### **Complex Problem Solving:**
- **"Plan the architecture for this new feature"**
- **"Think through the pros and cons of this approach"**
- **"What's the best strategy for implementing this?"**
- **"Walk me through the steps to solve this problem"**

#### **Analysis & Decision Making:**
- **"Analyze the trade-offs between these options"**
- **"What are the potential risks of this change?"**
- **"Help me think through the implications"**
- **"Break down this complex task into steps"**

#### **Strategic Planning:**
- **"How should we approach this migration?"**
- **"What's the sequence for implementing these features?"**
- **"Plan the rollout strategy for this update"**
- **"Think step-by-step about this debugging approach"**

### **🛠️ Sequential Thinking Features:**
- **Meta-cognition** - Self-reflective thinking processes
- **Step-by-step reasoning** - Structured problem decomposition
- **Dynamic planning** - Adaptive strategy adjustment
- **Progress tracking** - Monitor thinking workflow

---

## 💡 Usage Examples

### **Example 1: Code Discovery (Automatic Serena)**
**You ask:** "Find all the authentication methods in the RevivaTech project"

**Claude automatically:**
1. Uses `get_symbols_overview` to understand project structure
2. Uses `search_for_pattern` to find auth-related patterns
3. Uses `find_symbol` to locate specific authentication functions
4. Uses `read_memory` to recall previous auth analysis
5. Provides comprehensive overview with file locations

### **Example 2: Complex Planning (Automatic Sequential Thinking)**
**You ask:** "Plan how to add real-time notifications to the RevivaTech platform"

**Claude automatically:**
1. Uses Sequential Thinking to break down the problem
2. Analyzes current architecture with structured reasoning
3. Considers WebSocket vs SSE vs polling approaches
4. Plans database schema changes step-by-step
5. Sequences implementation phases strategically

### **Example 3: Combined Usage**
**You ask:** "Refactor the authentication system to use better-auth"

**Claude automatically combines both:**
1. **Serena MCP**: Analyzes current auth implementation
2. **Sequential Thinking**: Plans migration strategy
3. **Serena MCP**: Identifies all files that need changes
4. **Sequential Thinking**: Sequences the refactoring steps
5. **Serena MCP**: Implements changes with symbol-level precision

---

## 🔒 Security & Approval

### **Auto-Approved Tool Categories:**

**Serena MCP:**
- `serena` - Core Serena operations
- `symbol` - Symbol analysis and navigation  
- `memory` - Project knowledge operations
- `file` - File read/write operations

**Sequential Thinking MCP:**
- `sequentialthinking` - All thinking operations

**What this means:**
- ✅ **No interruptions** - Tools execute immediately
- ✅ **Seamless experience** - Natural conversation flow
- ✅ **Still secure** - Only pre-approved categories
- ⚙️ **Can be modified** - Edit `.kiro/settings/mcp.json` if needed

---

## 🛠️ Troubleshooting

### **If Serena tools don't activate:**
1. **Check connection:** `claude mcp list` (should show ✓ Connected)
2. **Try manual request:** "Use Serena to find..."
3. **Restart dashboard:** `/opt/webapps/revivatech/serena/restart-dashboard.sh`

### **If Sequential Thinking doesn't activate:**
1. **Use explicit request:** "Think through this step-by-step..."
2. **Check MCP status:** Should show sequential-thinking as ✓ Connected
3. **Try complex problem:** Ask for multi-step analysis

### **Dashboard Access:**
- **Serena Dashboard:** http://localhost:24282/dashboard/index.html
- **View logs:** `tail -f /tmp/serena-dashboard.log`
- **Check processes:** `ps aux | grep serena`

---

## 🎯 Best Practices

### **For Code Tasks:**
- **Be specific about scope:** "In the RevivaTech backend..." 
- **Mention file patterns:** "All TypeScript files..."
- **Reference project structure:** "In the services directory..."

### **For Planning Tasks:**
- **Ask for step-by-step breakdown** to trigger Sequential Thinking
- **Mention complexity** to activate structured reasoning
- **Request analysis** to get thorough evaluation

### **Combined Usage:**
- **Start with analysis** (triggers Serena for discovery)
- **Then ask for planning** (triggers Sequential Thinking)
- **Finally request implementation** (triggers both for execution)

---

## 📊 MCP Server Status Commands

**Check all MCP servers:**
```bash
claude mcp list
```

**Restart Serena dashboard:**
```bash
/opt/webapps/revivatech/serena/restart-dashboard.sh
```

**View Serena logs:**
```bash
tail -f /tmp/serena-dashboard.log
```

**Reset MCP approvals:**
```bash
claude mcp reset-project-choices
```

---

*With both MCPs active, you get the best of both worlds: semantic code intelligence through Serena and enhanced reasoning through Sequential Thinking, all working automatically to provide superior development assistance.*