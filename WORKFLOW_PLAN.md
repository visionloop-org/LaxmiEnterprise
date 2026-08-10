# Laxmi Enterprise - Coherent Workflow Plan

## Current Status (Updated Aug 11, 2026)
- ✅ Monorepo structure established
- ✅ Shared packages created (@laxmi/shared)
- ✅ Admin dashboard using shared packages
- ✅ Supervisor app running (not yet using shared packages)
- ✅ Backend API running with MongoDB
- ✅ CORS configured for both apps
- ✅ Knowledge graph regenerated (784 nodes, 1238 edges, 62 communities)
- ✅ Understanding workflow documented

## Phase 1: Code Consolidation (High Priority)

### 1.1 Refactor Supervisor App to Use Shared Packages
**Goal**: Eliminate code duplication between apps
**Tasks**:
- Update supervisor app package.json to use @laxmi/shared
- Replace local imports with shared package imports
- Remove duplicate files from supervisor app
- Test supervisor app functionality
- Verify both apps work with shared packages

**Benefits**: Single source of truth, easier maintenance, consistent behavior

### 1.2 Move More Code to Shared Packages
**Goal**: Maximize code reuse
**Tasks**:
- Move common UI components (tables, forms, modals) to shared
- Move utility functions (formatters, validators) to shared
- Move additional hooks (useFilters, useStatistics) to shared
- Update both apps to use new shared components
- Test all shared components in both contexts

**Benefits**: Consistent UI, reduced development time for new features

## Phase 2: Admin Dashboard Enhancement (High Priority)

### 2.1 Add Date Range Filtering
**Goal**: Enable historical data analysis
**Tasks**:
- Add date range picker component
- Update API calls to include date parameters
- Filter attendance and vehicle data by date range
- Add session selection dropdown
- Display statistics for selected period

**Benefits**: Better data analysis, historical reporting

### 2.2 Add Export Functionality
**Goal**: Enable data export for reporting
**Tasks**:
- Add CSV export for employee attendance
- Add CSV export for vehicle status
- Add PDF report generation
- Add export buttons to admin dashboard
- Test export functionality

**Benefits**: Offline reporting, data sharing, compliance

### 2.3 Add Advanced Analytics
**Goal**: Provide deeper insights
**Tasks**:
- Add attendance trends charts
- Add vehicle utilization metrics
- Add employee performance metrics
- Add comparative analysis (week-over-week, month-over-month)
- Create analytics dashboard section

**Benefits**: Better decision making, performance tracking

## Phase 3: Backend Improvements (Medium Priority)

### 3.1 Implement Refresh Token Endpoint
**Goal**: Improve authentication security
**Tasks**:
- Add /auth/refresh endpoint to backend
- Update frontend to use refresh tokens
- Implement proper token rotation
- Add token blacklist on logout
- Test refresh token flow

**Benefits**: Better security, improved user experience

### 3.2 Add User Management
**Goal**: Enable multi-user support
**Tasks**:
- Create user model in backend
- Add user CRUD endpoints
- Add role-based access control
- Update admin dashboard with user management
- Add user creation/deletion in admin

**Benefits**: Multi-user support, better security, audit trails

### 3.3 Add Audit Logging
**Goal**: Track all system changes
**Tasks**:
- Enhance existing audit events
- Add comprehensive logging for all operations
- Create audit log viewer in admin
- Add export functionality for audit logs
- Add log retention policies

**Benefits**: Compliance, debugging, security monitoring

## Phase 4: Security Enhancements (Low Priority)

### 4.1 Move to httpOnly Cookies
**Goal**: Improve token security
**Tasks**:
- Update backend to use httpOnly cookies
- Update frontend to work with cookie-based auth
- Remove localStorage token storage
- Test cookie-based authentication
- Update documentation

**Benefits**: Better security, protection against XSS

### 4.2 Add CSRF Protection
**Goal**: Prevent cross-site request forgery
**Tasks**:
- Implement CSRF token generation in backend
- Add CSRF validation to all state-changing endpoints
- Update frontend to include CSRF tokens
- Test CSRF protection
- Update documentation

**Benefits**: Better security, protection against CSRF attacks

## Phase 5: Deployment & DevOps (Medium Priority)

### 5.1 Docker Configuration
**Goal**: Containerize applications
**Tasks**:
- Create Dockerfile for supervisor app
- Create Dockerfile for admin app
- Create docker-compose.yml for all services
- Add environment variable configuration
- Test local Docker deployment

**Benefits**: Consistent deployment, easier scaling

### 5.2 CI/CD Pipeline
**Goal**: Automate testing and deployment
**Tasks**:
- Set up GitHub Actions or similar CI/CD
- Add automated testing
- Add automated builds
- Add deployment to staging/production
- Add rollback capabilities

**Benefits**: Automated deployment, faster releases, better quality

## Phase 6: Documentation (Low Priority)

### 6.1 Technical Documentation
**Goal**: Comprehensive developer documentation
**Tasks**:
- Document shared package API
- Document backend API endpoints
- Document component library
- Add code examples
- Create architecture diagrams

**Benefits**: Easier onboarding, better maintenance

### 6.2 User Documentation
**Goal**: End-user guides
**Tasks**:
- Create supervisor app user guide
- Create admin dashboard user guide
- Add troubleshooting section
- Create video tutorials
- Add FAQ section

**Benefits**: Better user experience, reduced support burden

## Execution Order

### Immediate (This Week)
1. Refactor supervisor app to use shared packages
2. Add date range filtering to admin dashboard
3. Add export functionality to admin dashboard

### Short Term (Next 2 Weeks)
4. Move more components to shared packages
5. Implement refresh token endpoint
6. Add user management to backend

### Medium Term (Next Month)
7. Add advanced analytics to admin dashboard
8. Create Docker configuration
9. Add audit logging

### Long Term (Ongoing)
10. Security enhancements (httpOnly cookies, CSRF)
11. CI/CD pipeline setup
12. Comprehensive documentation

## Success Metrics
- Code duplication reduced by 80%
- Both apps using 100% shared packages
- Admin dashboard has full date range filtering
- Export functionality working for all data types
- Docker deployment working locally
- Documentation complete for all shared components
