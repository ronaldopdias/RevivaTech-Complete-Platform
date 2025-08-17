# RULE 2: KIRO SPECIFICATION METHODOLOGY - Detailed Reference

**MANDATORY FOR COMPLEX FEATURES - SYSTEMATIC PLANNING APPROACH**
*Based on successful Kiro IDE specification system*

## **TRIGGER CONDITIONS:**
- Features requiring >5 files or components
- Major architectural changes or system integrations
- Cross-service dependencies or complex workflows
- High-risk implementations with business impact
- User-requested comprehensive planning and documentation

## **3-DOCUMENT SPECIFICATION SYSTEM:**

### **📋 DOCUMENT 1: Requirements (requirements.md)**
- **User Story Format**: "As a [role], I want [goal] so that [benefit]"
- **Acceptance Criteria**: WHEN/THEN conditions with specific outcomes
- **Requirement Numbering**: Hierarchical system (1.1, 1.2, 2.1, etc.)
- **Success Metrics**: Quantifiable validation criteria
- **Risk Assessment**: High/Medium/Low risk items with mitigation
- **Dependencies**: Internal and external requirements

### **🎨 DOCUMENT 2: Design (design.md)**
- **System Architecture**: Mermaid diagrams for flows and components
- **Interface Definitions**: Complete TypeScript interfaces
- **Data Models**: Database schema and API contracts
- **Security Considerations**: Authentication, authorization, data protection
- **Performance Requirements**: Response times, scalability targets
- **Error Handling**: Comprehensive error scenarios and recovery
- **Testing Strategy**: Unit, integration, and E2E testing approach

### **✅ DOCUMENT 3: Tasks (tasks.md)**
- **Granular Implementation**: Step-by-step checklist with effort estimates
- **Requirement Traceability**: Each task maps to specific requirements
- **Completion Tracking**: Checkbox system with status updates
- **Quality Gates**: Phase completion criteria and validation
- **Risk Mitigation**: Specific tasks to address identified risks
- **Dependencies**: Task sequencing and prerequisite management

## **INTEGRATION WITH RULE 1:**
1. Complex Feature Request → RULE 2: Create 3-Document Spec
2. RULE 1: IDENTIFY Existing Services
3. RULE 1: VERIFY & ANALYZE
4. Update Design Based on Findings  
5. RULE 1: INTEGRATE or CREATE
6. RULE 1: TEST & DOCUMENT
7. RULE 2: Implementation Complete

## **SPECIFICATION TEMPLATES:**
```bash
# Create new specification
cp -r /opt/webapps/revivatech/.claude/templates /opt/webapps/revivatech/.claude/specs/[feature-name]
cd /opt/webapps/revivatech/.claude/specs/[feature-name]

# Edit templates with specific feature details
# requirements.md - Define user stories and acceptance criteria
# design.md - Create architecture and interfaces
# tasks.md - Break down implementation steps
```

## **VALIDATION WORKFLOW:**
1. **Specification Review**: All 3 documents complete and consistent
2. **Stakeholder Approval**: Requirements validated by business stakeholders
3. **Technical Review**: Design approved by technical lead
4. **Implementation Ready**: Tasks broken down with clear deliverables
5. **RULE 1 Integration**: Existing service discovery incorporated

## **QUALITY CHECKPOINTS:**
- [ ] All user stories have measurable acceptance criteria
- [ ] Architecture diagrams show complete system flow
- [ ] All interfaces defined with TypeScript contracts
- [ ] Security and performance requirements specified
- [ ] Tasks have requirement traceability and effort estimates
- [ ] Risk mitigation strategies documented
- [ ] Testing approach covers all user workflows