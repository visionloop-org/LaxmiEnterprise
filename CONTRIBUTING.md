# 🤝 Contributing to Laxmi Enterprise

Thank you for considering contributing to **Laxmi Enterprise** — an open-source attendance and workforce management system built on a 100% free-forever stack (React 19 + Google Sheets + GitHub Pages).

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🚀 How Can I Contribute?

### 🐛 Bug Reports
Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) to file a bug. Include:
- Clear reproduction steps
- Expected vs actual behavior  
- Device/browser info

### ✨ Feature Requests
Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md).

### 🔧 Code Contributions
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes with tests
4. Ensure all checks pass
5. Submit a pull request

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js** >= 22 (use `nvm` or `volta`)
- **npm** >= 10
- **Git**

### Installation

```bash
git clone https://github.com/visionloop-org/LaxmiEnterprise.git
cd LaxmiEnterprise
npm install
```

### Environment Setup

Copy the example env files:

```bash
cp apps/admin/.env.example apps/admin/.env
cp apps/supervisor/.env.example apps/supervisor/.env
```

The apps work out-of-the-box with the shared Google Sheets production database. No additional setup required.

### Running Apps

```bash
# Admin Portal (runs on :5174)
npm run dev:admin

# Supervisor App (runs on :5173)
npm run dev:supervisor
```

### Running Tests

```bash
# All shared tests
npm run test:shared

# Specific test suites
npm run test:computation --workspace=packages/shared  # Client-side heavy computation engine
npm run test:gsheets     --workspace=packages/shared  # Multi-spreadsheet router & backups
npm run test:utils       --workspace=packages/shared  # Security & formatting utilities
```

### Building

```bash
# Build all apps
npm run build

# Assemble unified GitHub Pages PWA distribution bundle
npm run build:pages

# Build specific apps
npm run build:admin
npm run build:supervisor
```


---

## 📐 Coding Standards

### File Size & Reusability
- **Max file length**: 200 lines. Split into components or utilities if larger.
- Prefer **composition** over inheritance.
- Create reusable components in `packages/shared/`.

### JavaScript/React
- Use **ES Modules** (`import`/`export`) — no CommonJS in app code
- Use **React functional components** with hooks only
- Use **`@tanstack/react-query`** for server state management
- Name files with the component name (PascalCase for components, camelCase for utils)
- Use **Tailwind CSS** for styling — avoid inline styles

### Git Commits
Use conventional commits format:
```
type(scope): description

feat(attendance): add biometric check-in support
fix(sheets): handle empty rows in salary sheet
docs(wiki): update architecture diagram
refactor(shared): split googleSheetsService into smaller modules
test(utils): add formatCurrency edge cases
chore(deps): update vite to v8.3
```

### Linting
This project uses **OXLint** (very fast Rust-based linter):
```bash
npm run lint       # check
npm run lint:fix   # auto-fix
```

---

## 🔀 Pull Request Process

1. **Branch naming**: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`
2. **PR title**: Follow conventional commits format
3. **CI must pass**: All checks (lint, test, build) must be green ✅
4. **Self-review**: Review your own diff before requesting review
5. **Description**: Fill out the PR template completely
6. **Scope**: Keep PRs focused — one feature or fix per PR

### PR Checklist (pre-submit)
- [ ] `npm run lint` passes
- [ ] `npm run test:shared` passes
- [ ] `npm run build` passes
- [ ] No `.env` files committed
- [ ] No `console.log` left in production code
- [ ] New components have JSDoc comments

---

## 🐛 Reporting Bugs

Please use GitHub Issues with the **Bug Report** template. Before filing:
1. Search existing issues to avoid duplicates
2. Reproduce in latest `master`
3. Test in an incognito window (to rule out caching)

---

## 💡 Requesting Features

Use GitHub Issues with the **Feature Request** template. Explain:
- The problem you're solving
- Your proposed solution
- Any alternatives considered
- Willingness to implement it yourself

---

## 🏗️ Project Architecture

```
LaxmiEnterprise/
├── apps/
│   ├── admin/         # React admin portal (Vite, PWA, InstallAppButton)
│   └── supervisor/    # React supervisor app (Vite, PWA, Android mobile drawer)
├── packages/
│   └── shared/        # Centralized workspace package
│       ├── components/# InstallAppButton, StatusBadge, GoogleSheetsSyncModal, ArrivedTimeModal
│       ├── hooks/     # React Query hooks (useEmployees, useVehicles, useTrips)
│       ├── services/  # googleSheetsService.js & clientComputationService.js
│       ├── utils/     # Logger, requestId, sanitizer, config
│       └── tests/     # Mocha/Chai test suites (computation, gsheets, utils)
├── google-sheets/     # Apps Script multi-spreadsheet router backend (Code.gs)
├── dist/              # Assembled GitHub Pages distribution bundle with service worker & manifests
├── scripts/           # Build & PWA icon generation scripts
└── .github/           # CI/CD GitHub Actions workflows & templates
```

See the [Architecture Wiki](https://github.com/visionloop-org/LaxmiEnterprise/wiki/Architecture-and-Tech-Stack) for details.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
