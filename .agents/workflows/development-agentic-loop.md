---
trigger: manual
description: Development agentic loop for systematic plan execution
---

# Development Agentic Loop System

## Purpose
Automatically and systematically progress through the Laxmi Enterprise High-Priority Architecture Upgrade Plan until completion, with intelligent task selection, validation, and progress tracking.

## Loop Architecture

### 1. Plan State Management
**Current Plan:** `C:\Users\pc\.devin\plans\plan-2584fdeb04026558.md`
**Progress Tracking:** `D:\VisionLoop\Projects\LaxmiEnterprise\.devin\progress.json`

### 2. Loop Execution Phases

#### Phase A: Plan Assessment
1. **Read Current Plan State**
   - Read plan file
   - Parse completed/in-progress/pending items
   - Identify next actionable item

2. **Validate Current State**
   - Check if last completed step validation passed
   - Verify dependencies are met
   - Confirm environment is ready

#### Phase B: Task Execution
1. **Select Next Task**
   - Priority: Critical > High > Medium > Low
   - Dependencies: All prerequisites must be completed
   - Blockers: Skip blocked items, mark as blocked

2. **Execute Task**
   - Use tool/skill maximization framework
   - Follow implementation patterns from plan
   - Apply quality gates

3. **Validate Implementation**
   - Run validation checks from plan
   - Execute relevant tests
   - Verify quality standards

#### Phase C: Progress Update
1. **Update Plan State**
   - Mark completed items as [x]
   - Update in-progress items
   - Note any blockers or issues

2. **Update Progress Tracking**
   - Record completion timestamp
   - Note any deviations
   - Update metrics

3. **Generate Next Step**
   - Identify next actionable item
   - Check for completion
   - If complete, generate summary

### 3. Loop Termination Conditions

**Loop terminates when:**
- All plan items are completed and validated
- Unrecoverable blocker encountered (user intervention required)
- User explicitly stops the loop
- Maximum iterations reached (safety limit)

## Current Plan State

### Phase 1: Foundation Monitoring & Testing ✅ COMPLETED
- [x] Step 1.1: Enhanced Logging Infrastructure
- [x] Step 1.2: Critical E2E Test Suite

### Phase 2: PDF Archival System 🔄 IN PROGRESS
- [x] Step 2.1: Apps Script PDF Upload Endpoint
- [x] Step 2.2: Client-Side PDF Upload Integration
- [ ] Step 2.3: Monthly Payroll Compilation

### Phase 3: Performance Optimization ⏳ PENDING
- [ ] Step 3.1: Bundle Size Optimization
- [ ] Step 3.2: Virtual Scrolling for Large Tables
- [ ] Step 3.3: Image Optimization

### Phase 4: Security Enhancements ⏳ PENDING
- [ ] Step 4.1: Content Security Policy
- [ ] Step 4.2: Rate Limiting
- [ ] Step 4.3: Session Management

### Phase 5: Basic Hardware Integration ⏳ PENDING
- [ ] Step 5.1: USB QR Scanner Support
- [ ] Step 5.2: Mobile Camera QR Scanner
- [ ] Step 5.3: Scan-to-Attendance Workflow

## Execution Strategy

### Immediate Next Task
**Phase 2, Step 2.3: Monthly Payroll Compilation**
- Priority: Medium
- Dependencies: Completed (Step 2.1, 2.2)
- Estimated Time: 2-3 hours

### Task Queue
1. Phase 2.3: Monthly Payroll Compilation
2. Phase 3.1: Bundle Size Optimization
3. Phase 3.2: Virtual Scrolling for Large Tables
4. Phase 3.3: Image Optimization
5. Phase 4.1: Content Security Policy
6. Phase 4.2: Rate Limiting
7. Phase 4.3: Session Management
8. Phase 5.1: USB QR Scanner Support
9. Phase 5.2: Mobile Camera QR Scanner
10. Phase 5.3: Scan-to-Attendance Workflow

## Validation Gates

### Pre-Execution Validation
- [ ] Plan file exists and is readable
- [ ] Previous step validations passed
- [ ] Dependencies are met
- [ ] Environment is ready

### Post-Execution Validation
- [ ] Implementation matches plan requirements
- [ ] All validation checks from plan pass
- [ ] Tests pass (if applicable)
- [ ] Documentation updated (if required)
- [ ] No regressions introduced

## Error Handling

### Recoverable Errors
- Retry with different approach
- Use alternative implementation
- Mark as warning, continue

### Unrecoverable Errors
- Mark item as blocked
- Update plan with error details
- Request user intervention
- Pause loop

## Progress Reporting

### Loop Iteration Report
```
Iteration: N
Task: [Phase X.Step Y]
Status: [COMPLETED/IN_PROGRESS/BLOCKED]
Time: [Duration]
Validation: [PASSED/FAILED]
Next Task: [Phase X.Step Z]
```

### Summary Report (on completion)
```
Total Iterations: N
Total Time: X hours
Completed Items: N
Blocked Items: N
Success Rate: X%
Recommendations: [...]
```

## Agentic Loop Commands

### Start Loop
```bash
# Automatically starts from current state
devin:agentic-loop:start
```

### Continue Loop
```bash
# Continues from last completed task
devin:agentic-loop:continue
```

### Pause Loop
```bash
# Pauses after current task
devin:agentic-loop:pause
```

### Resume Loop
```bash
# Resumes from paused state
devin:agentic-loop:resume
```

### Stop Loop
```bash
# Stops immediately, generates summary
devin:agentic-loop:stop
```

### Get Status
```bash
# Returns current loop state
devin:agentic-loop:status
```

## Integration with Tool/Skill Framework

### Tool Selection per Phase
- **Plan Assessment:** `read`, `code_search`, `graphify query`
- **Task Execution:** Variable based on task type (see skill framework)
- **Validation:** `exec`, `read`, `grep`
- **Progress Update:** `write`, `edit`

### Skill Invocation per Task Type
- **Architecture Changes:** `system-architecture-and-design`
- **Code Development:** `typescript-and-modern-javascript` + `clean-code-and-refactoring`
- **Testing:** `test-driven-development`
- **Performance:** `performance-profiling-and-optimization`
- **Security:** `web-security-and-owasp` + `code-review-and-security-auditing`
- **Documentation:** `documentation-and-technical-writing`

## Monitoring & Metrics

### Loop Performance Metrics
- Task completion rate
- Average task duration
- Validation pass rate
- Error recovery rate

### Project Impact Metrics
- Code quality metrics
- Test coverage
- Performance improvements
- Security posture

## Safety Mechanisms

### Maximum Iterations
- Default: 50 iterations
- Configurable per session
- Prevents infinite loops

### Timeout per Task
- Default: 30 minutes per task
- Configurable per task type
- Prevents hanging

### User Confirmation
- Required for destructive operations
- Required for phase transitions
- Optional for routine tasks

## Manual Overrides

### Skip Task
```bash
devin:agentic-loop:skip [task-id]
```

### Force Complete
```bash
devin:agentic-loop:force-complete [task-id]
```

### Retry Task
```bash
devin:agentic-loop:retry [task-id]
```

### Reprioritize
```bash
devin:agentic-loop:reprioritize [task-id] [new-priority]
```

---

## Usage Example

```javascript
// Start the agentic loop
StartAgenticLoop({
  planPath: 'C:\\Users\\pc\\.devin\\plans\\plan-2584fdeb04026558.md',
  progressPath: 'D:\\VisionLoop\\Projects\\LaxmiEnterprise\\.devin\\progress.json',
  maxIterations: 50,
  taskTimeout: 30 * 60 * 1000, // 30 minutes
  autoContinue: true,
  validationStrict: true
})
```

The loop will automatically:
1. Assess current plan state
2. Select next actionable task
3. Execute with tool/skill maximization
4. Validate implementation
5. Update progress
6. Continue until completion or termination condition
