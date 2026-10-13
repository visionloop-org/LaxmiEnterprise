---
trigger: always_on
description: Enhanced agent instructions maximizing tool and skill usage for Laxmi Enterprise development
---

# Enhanced Agent Instructions for Laxmi Enterprise

## Core Philosophy: Tool-First, Skill-Augmented Development

This agent prioritizes intelligent tool selection and skill utilization to maximize development efficiency, code quality, and architectural coherence for the Laxmi Enterprise serverless workforce management system.

## 1. Mandatory Tool Usage Patterns

### 1.1 Codebase Understanding & Navigation
**ALWAYS use these tools before manual file reading:**

- **For Architecture Questions:**
  - First: `graphify query "<question>"` (if graphify-out/ exists)
  - Then: `graphify path "<entity A>" "<entity B>"` for relationships
  - Finally: `graphify explain "<concept>"` for focused explanations
  - Last resort: Read files or use grep

- **For Code Location:**
  - Use `find_file_by_name` with glob patterns (e.g., `**/*.jsx`, `**/*.js`)
  - Use `grep` for content searches with specific patterns
  - Use `code_search` for complex architectural questions

- **For Project Context:**
  - Read `MASTER INSTRUCTIONS.md` first for project boundaries
  - Read `ARCHITECTURE.md` for system design
  - Read `TODO.md` for current roadmap
  - Read `WORKFLOW_PLAN.md` for implementation status

### 1.2 File Operations Strategy
**Follow this hierarchy for file modifications:**

1. **Read First:** Always use `read` tool before editing
2. **Batch Operations:** Group related file edits together
3. **Validation:** Use read-only commands to verify changes
4. **Documentation:** Update related docs when modifying core files

### 1.3 Development Workflow Tools
**Use these tools for specific development tasks:**

- **Testing:** `exec` for running test commands, `read` for test results
- **Build:** `exec` for build commands, `read` for build outputs
- **Git:** `exec` for git operations, `read` for git status
- **Dependencies:** `exec` for package management, `read` for package.json
- **Linting:** `exec` for lint commands, analyze output for issues

## 2. Skill-Augmented Development

### 2.1 Mandatory Skill Invocation
**ALWAYS invoke relevant skills when task matches:**

- **Code Quality & Refactoring:**
  - Invoke `clean-code-and-refactoring` for code improvements
  - Invoke `typescript-and-modern-javascript` for JS/TS work
  - Invoke `debugging-and-root-cause-analysis` for bug fixing

- **Architecture & Design:**
  - Invoke `system-architecture-and-design` for architectural decisions
  - Invoke `api-design-rest-graphql` for API changes
  - Invoke `database-design-and-sql-optimization` for data layer work

- **Testing & Quality:**
  - Invoke `test-driven-development` for new features
  - Invoke `code-review-and-security-auditing` for security reviews
  - Invoke `performance-profiling-and-optimization` for performance work

- **Documentation:**
  - Invoke `documentation-and-technical-writing` for doc updates
  - Invoke `understand` for codebase analysis
  - Invoke `understand-explain` for deep-dive explanations

- **DevOps & CI/CD:**
  - Invoke `ci-cd-pipeline-automation` for workflow changes
  - Invoke `docker-and-containerization` for container work
  - Invoke `git-workflow-expert` for git operations

### 2.2 Skill Invocation Patterns
**When to invoke multiple skills:**

1. **Architecture Changes:** 
   - `system-architecture-and-design` + `api-design-rest-graphql`
   - `clean-code-and-refactoring` + `typescript-and-modern-javascript`

2. **New Features:**
   - `test-driven-development` + `typescript-and-modern-javascript`
   - `documentation-and-technical-writing` + `understand`

3. **Performance Work:**
   - `performance-profiling-and-optimization` + `clean-code-and-refactoring`
   - `debugging-and-root-cause-analysis` for investigation

4. **Security Changes:**
   - `web-security-and-owasp` + `code-review-and-security-auditing`
   - `database-design-and-sql-optimization` for data security

## 3. Intelligent Tool Selection Matrix

### 3.1 Code Analysis
| Task | Primary Tool | Secondary Tool | Skill Augmentation |
|------|--------------|----------------|-------------------|
| Find file location | `find_file_by_name` | `grep` | `understand` |
| Understand architecture | `graphify query` | `read ARCHITECTURE.md` | `system-architecture-and-design` |
| Code relationships | `graphify path` | `grep` | `understand-explain` |
| Search content | `grep` | `code_search` | N/A |
| Large-scale analysis | `code_search` | `graphify explain` | `understand` |

### 3.2 Development Operations
| Task | Primary Tool | Secondary Tool | Skill Augmentation |
|------|--------------|----------------|-------------------|
| Write code | `write` | N/A | `typescript-and-modern-javascript` |
| Edit code | `edit` | `read` (first) | `clean-code-and-refactoring` |
| Run tests | `exec` | `read` results | `test-driven-development` |
| Build project | `exec` | `read` output | `ci-cd-pipeline-automation` |
| Git operations | `exec` | `read` status | `git-workflow-expert` |
| Package management | `exec` | `read` package.json | N/A |

### 3.3 Quality Assurance
| Task | Primary Tool | Secondary Tool | Skill Augmentation |
|------|--------------|----------------|-------------------|
| Code review | `read` + analysis | `grep` patterns | `code-review-and-security-auditing` |
| Performance check | `exec` profiling | `read` metrics | `performance-profiling-and-optimization` |
| Security audit | `grep` security patterns | `read` security files | `web-security-and-owasp` |
| Debug issues | `read` logs | `exec` debug commands | `debugging-and-root-cause-analysis` |

## 4. Project-Specific Tool Patterns

### 4.1 Laxmi Enterprise Serverless Architecture
**ALWAYS follow these patterns:**

1. **Direct Auth & Partitioned Storage Operations:**
   - Use `grep` to find storage and auth calls (`authService.js`, `driveCsvService.js`)
   - `Code.gs` is retired: never add new Apps Script proxy dependencies
   - Verify 5-year data retention and <50MB active storage constraints
   - Skill: `database-design-and-sql-optimization` for data modeling

2. **Client-Side Computation:**
   - Use `read` to examine `ClientComputationService.js`
   - Use `grep` to find computation logic
   - Skill: `performance-profiling-and-optimization` for optimization
   - Skill: `typescript-and-modern-javascript` for type safety

3. **PWA Development:**
   - Use `find_file_by_name` for manifest files
   - Use `read` for service worker code
   - Skill: `frontend-modern-ui-ux` for PWA UX
   - Skill: `typescript-and-modern-javascript` for PWA logic

4. **Multi-App Coordination:**
   - Use `grep` across `apps/` and `packages/`
   - Use `code_search` for shared code patterns
   - Skill: `system-architecture-and-design` for architecture decisions
   - Skill: `clean-code-and-refactoring` for code deduplication

### 4.2 Testing & Quality Gates
**ALWAYS use this testing workflow:**

1. **Before Changes:**
   - Run existing tests: `exec npm test`
   - Read test results for baseline
   - Skill: `test-driven-development` for test planning

2. **During Development:**
   - Write tests first: `test-driven-development`
   - Use `exec` for incremental test runs
   - Use `read` for test coverage analysis

3. **After Changes:**
   - Run full test suite: `exec npm test`
   - Run linting: `exec npm run lint`
   - Use `read` to verify outputs
   - Skill: `code-review-and-security-auditing` for final review

## 5. Error Handling & Recovery

### 5.1 Tool Failure Strategy
**When tools fail, use this escalation:**

1. **Read/Write Failures:**
   - Retry with different parameters
   - Use alternative tools (grep vs code_search)
   - Fall back to manual inspection
   - Log error for investigation

2. **Build/Test Failures:**
   - Read error logs with `exec` and `read`
   - Use `debugging-and-root-cause-analysis` skill
   - Fix systematically, not randomly
   - Re-test after each fix

3. **Git Failures:**
   - Use `git-workflow-expert` skill for guidance
   - Read git status for context
   - Use `exec` for safe recovery commands
   - Never force destructive operations

### 5.2 Skill Integration Error Handling
**When skills fail or timeout:**

1. **Fallback to Manual Implementation:**
   - Use skill as guidance, not dependency
   - Implement manually if skill fails
   - Document skill failure for future reference

2. **Partial Skill Results:**
   - Use what works, ignore what doesn't
   - Combine with manual completion
   - Document partial results

3. **Skill Conflicts:**
   - Prioritize by task relevance
   - Use most specific skill first
   - Combine complementary skills strategically

## 6. Performance & Efficiency Optimization

### 6.1 Token Conservation (Local AI Priority)
**STRICTLY follow local AI token efficiency:**

1. **Client-Side Computation:**
   - ALL payroll, overtime, capacity calculations MUST be client-side
   - NEVER use online LLM APIs for business logic
   - Use `ClientComputationService` for all math operations

2. **File Inspection Efficiency:**
   - Use line ranges in `read` operations
   - Use `grep` for targeted content search
   - Use `graphify` for architectural queries (less token usage)

3. **Network Conservation:**
   - Prefer local tools over web searches
   - Use `code_search` over web browsing for code questions
   - Cache results when possible

### 6.2 Parallel Tool Usage
**MAXIMIZE parallel operations:**

1. **File Reading:**
   - Read multiple related files in parallel
   - Batch file operations when possible
   - Use parallel `read` calls for independent files

2. **Command Execution:**
   - Run independent commands in parallel
   - Use background processes for long-running tasks
   - Chain dependent commands logically

3. **Skill Invocation:**
   - Invoke complementary skills in parallel when appropriate
   - Use skill results to inform subsequent tool choices
   - Avoid redundant skill invocations

## 7. Quality Standards & Best Practices

### 7.1 Code Quality Standards
**ALWAYS maintain these standards:**

1. **TypeScript Best Practices:**
   - Use `typescript-and-modern-javascript` skill for TS work
   - Maintain type safety across shared packages
   - Use proper type definitions for API contracts

2. **Code Organization:**
   - Use `clean-code-and-refactoring` for structure improvements
   - Follow single responsibility principle
   - Keep files under 150 lines when possible

3. **Error Handling:**
   - Use `debugging-and-root-cause-analysis` for error patterns
   - Implement proper error boundaries
   - Add comprehensive error logging

### 7.2 Documentation Standards
**ALWAYS keep documentation current:**

1. **Code Documentation:**
   - Use `documentation-and-technical-writing` for doc updates
   - Update MASTER INSTRUCTIONS.md for architectural changes
   - Update TODO.md for roadmap changes

2. **API Documentation:**
   - Use `api-design-rest-graphql` for API docs
   - Maintain OpenAPI specifications
   - Document breaking changes

3. **Architecture Documentation:**
   - Use `system-architecture-and-design` for architecture docs
   - Update ARCHITECTURE.md for design changes
   - Use `understand` to generate architecture diagrams

## 8. Project-Specific Constraints

### 8.1 Serverless Architecture Constraints
**NEVER violate these principles:**

1. **No Backend Server:**
   - All data storage in Google Sheets
   - All computation client-side
   - No database servers

2. **Multi-Spreadsheet Rules:**
   - Respect 3-domain spreadsheet partitioning
   - Use proper domain routing
   - Maintain Google Drive folder structure

3. **PWA Requirements:**
   - Maintain offline-first architecture
   - Ensure service worker caching
   - Support installable app experience

### 8.2 Performance Constraints
**ALWAYS optimize for performance:**

1. **Client-Side Performance:**
   - Use `performance-profiling-and-optimization` skill
   - Optimize bundle sizes
   - Implement code splitting

2. **API Performance:**
   - Minimize Google Apps Script calls
   - Use efficient data structures
   - Implement proper caching

3. **Network Performance:**
   - Use offline-first architecture
   - Implement proper sync strategies
   - Optimize data transfer sizes

## 9. Continuous Improvement

### 9.1 Tool & Skill Evolution
**CONTINUOUSLY improve tool/skill usage:**

1. **Learn from Patterns:**
   - Analyze successful tool/skill combinations
   - Document effective patterns
   - Share learnings across tasks

2. **Adapt to Context:**
   - Choose tools based on task requirements
   - Adapt skill usage to project phase
   - Optimize for current constraints

3. **Measure Effectiveness:**
   - Track tool/skill success rates
   - Identify bottlenecks
   - Optimize frequently-used patterns

### 9.2 Knowledge Management
**MAINTAIN project knowledge efficiently:**

1. **Use Graphify:**
   - Keep graphify knowledge graph current
   - Run `graphify update .` after code changes
   - Use graphify for architectural queries

2. **Documentation Updates:**
   - Update docs immediately after changes
   - Maintain consistency across documentation
   - Use documentation skills for quality

3. **Code Comments:**
   - Add meaningful comments for complex logic
   - Update comments when code changes
   - Use comments to explain tool/skill choices

## 10. Decision Framework

### 10.1 Tool Selection Decision Tree
```
Task Type → Primary Tool → Secondary Tool → Skill Augmentation
```

**Examples:**
- Architecture Question → graphify query → read docs → system-architecture-and-design
- Code Search → grep → code_search → understand
- New Feature → test-driven-development → typescript-and-modern-javascript → documentation-and-technical-writing
- Bug Fix → debugging-and-root-cause-analysis → read logs → clean-code-and-refactoring
- Performance Issue → performance-profiling-and-optimization → read metrics → clean-code-and-refactoring

### 10.2 Skill Invocation Decision Tree
```
Task Category → Primary Skill → Secondary Skill → Tool Support
```

**Examples:**
- New API Endpoint → api-design-rest-graphql → typescript-and-modern-javascript → read/write
- Database Change → database-design-and-sql-optimization → performance-profiling-and-optimization → exec/read
- Security Update → web-security-and-owasp → code-review-and-security-auditing → grep/read
- UI Component → frontend-modern-ui-ux → typescript-and-modern-javascript → read/write
- CI/CD Change → ci-cd-pipeline-automation → git-workflow-expert → exec/read

## 11. Emergency Protocols

### 11.1 Tool Failure Emergency
**When critical tools fail:**

1. **Assess Impact:**
   - Determine if task can continue without failed tool
   - Identify alternative tools
   - Escalate if blocking

2. **Implement Workaround:**
   - Use alternative tool from matrix
   - Implement manually if needed
   - Document workaround for future

3. **Report Issue:**
   - Log tool failure details
   - Note context and impact
   - Suggest improvements

### 11.2 Skill Failure Emergency
**When skills fail or timeout:**

1. **Assess Skill Criticality:**
   - Determine if skill is essential or helpful
   - Identify if manual implementation is feasible
   - Consider alternative skills

2. **Implement Manual Solution:**
   - Use skill output as guidance
   - Implement manually based on best practices
   - Document manual approach

3. **Continue with Task:**
   - Don't let skill failure block progress
   - Use complementary tools
   - Maintain quality standards

## 12. Success Metrics

### 12.1 Tool Usage Effectiveness
**Measure tool usage success by:**

1. **Efficiency:**
   - Task completion time
   - Tool execution time
   - Token usage efficiency

2. **Accuracy:**
   - Correct tool selection
   - Proper tool configuration
   - Accurate result interpretation

3. **Quality:**
   - Code quality maintained
   - Documentation completeness
   - Test coverage maintained

### 12.2 Skill Integration Effectiveness
**Measure skill usage success by:**

1. **Relevance:**
   - Skill matches task requirements
   - Skill output is actionable
   - Skill provides unique value

2. **Timeliness:**
   - Skill executes within reasonable time
   - Skill doesn't block progress
   - Skill results are immediately useful

3. **Quality:**
   - Skill output quality is high
   - Skill recommendations are sound
   - Skill guidance is actionable

---

## Summary

This enhanced agent instruction framework maximizes tool and skill usage by:

1. **Mandating intelligent tool selection** with clear hierarchies
2. **Requiring skill augmentation** for appropriate tasks
3. **Optimizing for local AI efficiency** to conserve tokens
4. **Providing decision frameworks** for tool/skill choices
5. **Establishing quality standards** for all operations
6. **Including emergency protocols** for failure scenarios
7. **Measuring effectiveness** for continuous improvement

The goal is to create a highly efficient, skill-augmented development process that maximizes code quality while minimizing resource consumption and development time.