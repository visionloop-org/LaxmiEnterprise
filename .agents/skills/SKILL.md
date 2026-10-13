---
trigger: always_on
description: Maximize tool and skill usage for Laxmi Enterprise development with intelligent selection and augmentation patterns
---

# Laxmi Enterprise - Tool & Skill Maximization Framework

## Core Principle: Tool-First, Skill-Augmented Development

This framework ensures maximum efficiency by intelligently selecting tools and augmenting with skills for every development task.

## 1. Tool Selection Hierarchy

### 1.1 Codebase Understanding (Priority Order)
1. **Architecture Questions:** `graphify query` → `graphify path` → `graphify explain` → Read ARCHITECTURE.md
2. **Code Location:** `find_file_by_name` → `grep` → `code_search`
3. **Content Search:** `grep` → `code_search` → Read files
4. **Relationship Analysis:** `graphify path` → `grep` → Read related files

### 1.2 Development Operations (Priority Order)
1. **Code Writing:** `write` → Skill: `typescript-and-modern-javascript`
2. **Code Editing:** `read` → `edit` → Skill: `clean-code-and-refactoring`
3. **Testing:** `exec` → Read results → Skill: `test-driven-development`
4. **Building:** `exec` → Read output → Skill: `ci-cd-pipeline-automation`
5. **Git:** `exec` → Read status → Skill: `git-workflow-expert`

### 1.3 Quality Assurance (Priority Order)
1. **Code Review:** Read + `grep` → Skill: `code-review-and-security-auditing`
2. **Performance:** `exec` profiling → Read metrics → Skill: `performance-profiling-and-optimization`
3. **Security:** `grep` patterns → Read security files → Skill: `web-security-and-owasp`
4. **Debugging:** Read logs → `exec` debug → Skill: `debugging-and-root-cause-analysis`

## 2. Skill Invocation Triggers

### 2.1 Architecture & Design
**Trigger:** Any architectural decision, system design, or structural change
**Skills:** `system-architecture-and-design` + `api-design-rest-graphql`
**Tools:** `graphify query`, `read ARCHITECTURE.md`, `code_search`

### 2.2 Code Development
**Trigger:** Writing new code, refactoring existing code, implementing features
**Skills:** `typescript-and-modern-javascript` + `clean-code-and-refactoring`
**Tools:** `read`, `write`, `edit`, `grep`

### 2.3 Testing & Quality
**Trigger:** Writing tests, fixing bugs, quality improvements
**Skills:** `test-driven-development` + `code-review-and-security-auditing`
**Tools:** `exec`, `read`, `grep`

### 2.4 Performance & Optimization
**Trigger:** Performance issues, optimization tasks, efficiency improvements
**Skills:** `performance-profiling-and-optimization` + `clean-code-and-refactoring`
**Tools:** `exec`, `read`, `code_search`

### 2.5 Security & Compliance
**Trigger:** Security updates, vulnerability fixes, compliance requirements
**Skills:** `web-security-and-owasp` + `code-review-and-security-auditing`
**Tools:** `grep`, `read`, `code_search`

### 2.6 Documentation
**Trigger:** Documentation updates, API docs, architecture docs
**Skills:** `documentation-and-technical-writing` + `understand`
**Tools:** `read`, `write`, `graphify explain`

### 2.7 DevOps & CI/CD
**Trigger:** Workflow changes, CI/CD updates, deployment changes
**Skills:** `ci-cd-pipeline-automation` + `git-workflow-expert`
**Tools:** `exec`, `read`, `find_file_by_name`

## 3. Project-Specific Tool Patterns

### 3.1 Google Sheets Operations
**Tools:** `grep` → `read google-sheets/Code.gs` → `code_search`
**Skills:** `database-design-and-sql-optimization` + `api-design-rest-graphql`
**Patterns:**
- Always check Apps Script patterns before modifications
- Use `grep` to find all API calls before changes
- Read entire Code.gs before architectural changes
- Use skill for data modeling decisions

### 3.2 Client-Side Computation
**Tools:** `read ClientComputationService.js` → `grep` computation logic → `code_search`
**Skills:** `performance-profiling-and-optimization` + `typescript-and-modern-javascript`
**Patterns:**
- Read existing computation logic before changes
- Use `grep` to find all computation calls
- Use skill for optimization opportunities
- Maintain client-side computation principle

### 3.3 PWA Development
**Tools:** `find_file_by_name` manifests → `read` service workers → `grep` PWA patterns
**Skills:** `frontend-modern-ui-ux` + `typescript-and-modern-javascript`
**Patterns:**
- Find all PWA-related files first
- Read service worker implementation
- Use skill for UX optimization
- Maintain offline-first architecture

### 3.4 Multi-App Coordination
**Tools:** `grep` across apps/ and packages/ → `code_search` shared patterns → `read` shared files
**Skills:** `system-architecture-and-design` + `clean-code-and-refactoring`
**Patterns:**
- Search for shared code patterns across apps
- Use `code_search` for architectural consistency
- Use skill for architecture decisions
- Eliminate code duplication

## 4. Parallel Tool Usage Maximization

### 4.1 File Reading Parallelization
**When to use:** Reading multiple independent files
**Pattern:**
```javascript
// Read all related files in parallel
read(file1.js)
read(file2.js)
read(file3.js)
read(config.json)
```

### 4.2 Command Execution Parallelization
**When to use:** Running independent commands
**Pattern:**
```javascript
// Run independent commands in parallel
exec("npm test")
exec("npm run lint")
exec("npm run build")
```

### 4.3 Skill Invocation Parallelization
**When to use:** Complementary skills for same task
**Pattern:**
```javascript
// Invoke complementary skills in parallel
skill: system-architecture-and-design
skill: api-design-rest-graphql
skill: typescript-and-modern-javascript
```

## 5. Token Conservation Strategy

### 5.1 Local AI Priority
**STRICTLY follow local AI patterns:**

1. **Client-Side Computation:**
   - ALL payroll, overtime, capacity calculations MUST be client-side
   - NEVER use online LLM APIs for business logic
   - Use `ClientComputationService` for all math operations

2. **File Inspection Efficiency:**
   - Use line ranges in `read` operations (e.g., `offset`, `limit`)
   - Use `grep` for targeted content search
   - Use `graphify` for architectural queries (less token usage)

3. **Network Conservation:**
   - Prefer local tools over web searches
   - Use `code_search` over web browsing for code questions
   - Cache results when possible

### 5.2 Graphify Optimization
**MAXIMIZE graphify usage:**

1. **Architecture Queries:**
   - Use `graphify query` instead of reading multiple files
   - Use `graphify path` for relationship analysis
   - Use `graphify explain` for concept understanding

2. **Graph Maintenance:**
   - Run `graphify update .` after code changes
   - Keep graph current for efficient queries
   - Use graph for architectural reviews

3. **Wiki Navigation:**
   - Use graphify wiki instead of reading raw files
   - Navigate wiki structure for context
   - Use wiki for project understanding

## 6. Error Recovery Patterns

### 6.1 Tool Failure Recovery
**When tools fail, use this escalation:**

1. **Retry with Parameters:**
   - Try different tool parameters
   - Use alternative tools from matrix
   - Fall back to manual inspection

2. **Alternative Tool Selection:**
   - Use secondary tool from hierarchy
   - Combine tools for complex tasks
   - Use skill for guidance

3. **Manual Implementation:**
   - Implement manually if tools fail
   - Use skill output as guidance
   - Document manual approach

### 6.2 Skill Failure Recovery
**When skills fail or timeout:**

1. **Partial Result Usage:**
   - Use what works from skill output
   - Ignore what doesn't work
   - Combine with manual completion

2. **Manual Implementation:**
   - Use skill as guidance, not dependency
   - Implement based on best practices
   - Document manual approach

3. **Alternative Skills:**
   - Try complementary skills
   - Use most specific skill first
   - Combine skills strategically

## 7. Quality Assurance Integration

### 7.1 Pre-Change Quality Gates
**Before making changes:**

1. **Read Existing Code:**
   - Read files to be modified
   - Understand current implementation
   - Identify potential issues

2. **Run Tests:**
   - `exec npm test` for baseline
   - Read test results
   - Ensure tests pass

3. **Skill Consultation:**
   - Use relevant skills for guidance
   - Follow skill recommendations
   - Apply skill best practices

### 7.2 Post-Change Quality Gates
**After making changes:**

1. **Run Tests:**
   - `exec npm test` for verification
   - Read test results
   - Ensure all tests pass

2. **Run Linting:**
   - `exec npm run lint` for code quality
   - Read lint output
   - Fix any issues

3. **Skill Review:**
   - Use `code-review-and-security-auditing` skill
   - Apply skill recommendations
   - Ensure quality standards

## 8. Documentation Integration

### 8.1 Pre-Change Documentation
**Before making changes:**

1. **Read Relevant Docs:**
   - Read MASTER INSTRUCTIONS.md
   - Read ARCHITECTURE.md
   - Read TODO.md
   - Read WORKFLOW_PLAN.md

2. **Skill Documentation:**
   - Use `documentation-and-technical-writing` skill
   - Follow documentation best practices
   - Maintain doc consistency

### 8.2 Post-Change Documentation
**After making changes:**

1. **Update Master Instructions:**
   - Update MASTER INSTRUCTIONS.md for architectural changes
   - Update role assignments if changed
   - Update system boundaries if changed

2. **Update Architecture Docs:**
   - Update ARCHITECTURE.md for design changes
   - Use `system-architecture-and-design` skill
   - Maintain architecture consistency

3. **Update Roadmap Docs:**
   - Update TODO.md for completed items
   - Update WORKFLOW_PLAN.md for progress
   - Update milestones as needed

## 9. Continuous Improvement Metrics

### 9.1 Tool Usage Metrics
**Track these metrics:**

1. **Efficiency Metrics:**
   - Task completion time
   - Tool execution time
   - Token usage efficiency

2. **Accuracy Metrics:**
   - Correct tool selection rate
   - Proper tool configuration rate
   - Accurate result interpretation rate

3. **Quality Metrics:**
   - Code quality maintenance
   - Documentation completeness
   - Test coverage maintenance

### 9.2 Skill Usage Metrics
**Track these metrics:**

1. **Relevance Metrics:**
   - Skill-task match rate
   - Skill output actionability
   - Skill unique value provision

2. **Timeliness Metrics:**
   - Skill execution time
   - Skill non-blocking rate
   - Skill result immediacy

3. **Quality Metrics:**
   - Skill output quality
   - Skill recommendation soundness
   - Skill guidance actionability

## 10. Success Criteria

### 10.1 Tool Usage Success
**Successful tool usage when:**

1. **Efficient:**
   - Tasks complete in minimum time
   - Tools execute quickly
   - Token usage is optimized

2. **Accurate:**
   - Tools selected correctly
   - Tools configured properly
   - Results interpreted accurately

3. **Quality-Maintaining:**
   - Code quality maintained
   - Documentation complete
   - Test coverage maintained

### 10.2 Skill Usage Success
**Successful skill usage when:**

1. **Relevant:**
   - Skills match task requirements
   - Skill output is actionable
   - Skills provide unique value

2. **Timely:**
   - Skills execute quickly
   - Skills don't block progress
   - Skill results are immediately useful

3. **Quality-Focused:**
   - Skill output is high quality
   - Skill recommendations are sound
   - Skill guidance is actionable

---

## Summary

This framework maximizes tool and skill usage by:

1. **Providing clear tool selection hierarchies** for every task type
2. **Defining skill invocation triggers** for automatic augmentation
3. **Establishing project-specific patterns** for consistency
4. **Maximizing parallel operations** for efficiency
5. **Optimizing token usage** through local AI priority
6. **Providing error recovery patterns** for resilience
7. **Integrating quality assurance** at every step
8. **Measuring effectiveness** for continuous improvement

The goal is to create a highly efficient, tool-first, skill-augmented development process that maximizes code quality while minimizing resource consumption and development time.