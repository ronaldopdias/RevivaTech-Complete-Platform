# Next Session Todo List - AI Enhancement Implementation

## 🚀 IMMEDIATE START (Phase 1: Enhanced NLP Integration)

### High Priority Tasks - Week 1

#### Backend Setup
- [ ] **Install Rasa and dependencies**
  ```bash
  cd /opt/webapps/revivatech/backend
  pip install rasa
  pip install spacy
  python -m spacy download en_core_web_md
  ```

- [ ] **Verify Python environment**
  ```bash
  python --version  # Should be 3.8+
  pip list | grep rasa  # Verify installation
  ```

#### Create NLU Training Data Structure
- [ ] **Create directory structure**
  ```bash
  mkdir -p backend/nlu/training_data
  mkdir -p backend/nlu/models
  ```

- [ ] **Create device recognition intents file**
  - File: `backend/nlu/training_data/device_intents.yml`
  - Include: iPhone, MacBook, Samsung, Dell, HP, etc.
  - Examples: "My iPhone 14 screen is cracked"

- [ ] **Create problem entities file**
  - File: `backend/nlu/training_data/problem_entities.yml`
  - Include: cracked screen, battery drain, slow performance, overheating

- [ ] **Create Rasa configuration**
  - File: `backend/nlu/config.yml`
  - Configure spaCy pipeline with entity recognition

#### Test Basic NLU Functionality
- [ ] **Train initial model**
  ```bash
  cd backend/nlu
  rasa train
  ```

- [ ] **Test intent classification**
  ```bash
  rasa shell
  # Test: "My MacBook Pro screen is broken"
  ```

- [ ] **Verify entity extraction**
  - Device entities: MacBook Pro, iPhone 14, Samsung Galaxy
  - Problem entities: cracked, broken, slow, overheating

#### API Integration
- [ ] **Create Python NLU service**
  - File: `backend/services/nlu_service.py`
  - Function: `process_user_message(text)`
  - Return: intents, entities, confidence

- [ ] **Update Node.js API endpoint**
  - File: `backend/routes/ai-chatbot-enhanced.js`
  - Add call to Python NLU service
  - Test with Postman/curl

---

## 📋 MEDIUM PRIORITY (Phase 1 Continuation)

#### Enhanced Response Generation
- [ ] **Create response templates**
  - Device-specific responses
  - Problem-specific guidance
  - Cost estimation logic

- [ ] **Implement confidence scoring**
  - High confidence (>80%): Specific recommendations
  - Medium confidence (50-80%): Ask clarifying questions
  - Low confidence (<50%): General guidance

#### Testing & Validation
- [ ] **Create test cases**
  - 20+ device recognition examples
  - 15+ problem identification examples
  - Edge cases and error handling

- [ ] **Measure accuracy**
  - Intent classification: Target 90%+
  - Entity extraction: Target 85%+
  - Response relevance: User feedback

---

## 🔄 PREPARATION FOR PHASE 2 (Week 2)

#### Device Database Research
- [ ] **Evaluate Matomo Device Detector**
  - Install and test accuracy
  - Compare with OpenSTF database
  - Benchmark performance

- [ ] **Design device matching algorithm**
  - Text-based device extraction
  - User agent enhancement
  - Confidence scoring

---

## 📚 REFERENCE MATERIALS

### Essential Documents
1. **Main Implementation Guide**: `/Docs/AI_CHATBOT_ENHANCEMENT_IMPLEMENTATION.md`
2. **Session Handoff**: `/SESSION_HANDOFF_AI_ENHANCEMENT.md`
3. **Brand Guidelines**: `/Docs/PRD_RevivaTech_Brand_Theme.md`

### Code Examples (From Implementation Guide)
- **Training Data**: Lines 150-180
- **Python Services**: Lines 200-250
- **API Integration**: Lines 280-320
- **Database Schema**: Lines 350-400

### Testing Commands
```bash
# Check container status
docker ps | grep revivatech

# Test frontend
curl http://localhost:3010/health

# Test backend API
curl http://localhost:3011/api/health

# View logs
docker logs revivatech_new_backend --tail 20
```

---

## ⚠️ CRITICAL REMINDERS

### Project Boundaries
- ✅ **ONLY work in**: `/opt/webapps/revivatech/`
- ❌ **NEVER touch**: `/opt/webapps/website/` or `/opt/webapps/CRM/`
- ✅ **Use ports**: 3010, 3011, 5435, 6383 only

### Success Criteria for Phase 1
- [ ] Rasa installed and working
- [ ] Basic device recognition (iPhone, MacBook, Samsung)
- [ ] Problem identification (screen, battery, performance)
- [ ] API integration returning structured data
- [ ] Accuracy testing shows >80% intent classification

### Expected Time Investment
- **Phase 1**: 1 week (20-25 hours)
- **Daily Progress**: 3-4 tasks completed
- **Milestone Check**: Mid-week accuracy testing

---

## 🎯 SUCCESS METRICS

### Current Baseline (After July 19 Session)
- ✅ AI chatbot: Professional design with disclaimers
- ✅ GUI: Trust-building colors and styling
- ✅ Features: Voice/file upload disabled as requested

### Phase 1 Targets
- Device recognition: 80%+ accuracy (basic NLU)
- Intent classification: 90%+ accuracy
- API response time: <2 seconds
- User experience: Improved contextual responses

### Phase 1 Completion Criteria
- [ ] Working Rasa NLU model
- [ ] Enhanced API endpoint responding with structured data
- [ ] Test accuracy meeting targets
- [ ] Documentation updated with progress
- [ ] Ready to start Phase 2 (Device Database Integration)

---

**Document Status**: Ready for Next Session  
**Priority Level**: High (AI Enhancement is key project milestone)  
**Estimated Completion**: 1 week for Phase 1  
**Next Milestone**: Advanced device recognition with ML models