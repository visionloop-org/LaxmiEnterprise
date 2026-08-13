# API Type Synchronization Guide

## Overview
This setup ensures that your FastAPI backend and frontend TypeScript types stay synchronized automatically.

## How It Works

1. **Backend Changes**: When you modify Pydantic models or FastAPI routes
2. **OpenAPI Export**: Run the sync script to export the OpenAPI spec
3. **Type Generation**: TypeScript types are auto-generated from the spec
4. **Type Safety**: Frontend mapping functions use these generated types
5. **Validation**: Pre-commit hooks and CI checks ensure types stay current

## Manual Sync (After Backend Changes)

### Option 1: Using the sync script (Recommended)
```bash
# From ServerSide directory
cd ServerSide
python scripts/sync.py  # or sync.bat on Windows
```

### Option 2: Manual steps
```bash
# Export OpenAPI spec
cd ServerSide
python scripts/export_openapi.py

# Generate TypeScript types
cd ../packages/shared
npm run generate:types
```

## Automatic Sync (Pre-commit Hook)

### Install the pre-commit hook:
```bash
# Copy the pre-commit script to .git/hooks
cp scripts/pre-commit.sh .git/hooks/pre-commit  # Linux/Mac
cp scripts/pre-commit.bat .git/hooks/pre-commit  # Windows

# Make it executable (Linux/Mac)
chmod +x .git/hooks/pre-commit
```

### How it works:
- When you commit changes to `ServerSide/` files
- The hook automatically regenerates the OpenAPI spec and types
- The generated files are staged with your commit
- No manual sync needed!

## Verify Types Are Current

```bash
cd packages/shared
npm run check:types
```

This will fail if the generated types don't match the current OpenAPI spec.

## Type Checking Mapping Functions

```bash
cd packages/shared
npx tsc --noEmit
```

This validates that your JSDoc annotations match the generated types.

## Files Modified

### Backend (ServerSide/)
- `app/models/*.py` - Added separate Create/Update/Response models
- `app/api/v1/*/routes.py` - Added operationIds and explicit response_model
- `scripts/export_openapi.py` - Server-independent OpenAPI export
- `scripts/sync.sh` / `sync.bat` - Convenience script for syncing

### Frontend (packages/shared/)
- `services/rest*.js` - Added JSDoc type annotations
- `types/api.ts` - Auto-generated TypeScript types
- `check-types.js` - Script to verify types are current
- `tsconfig.json` - TypeScript config for checking .js files

## Benefits

- **Compile-time type safety** for mapping functions
- **Automatic drift detection** between backend and frontend
- **No server dependency** for type generation
- **Improved generated type names** from operationIds
- **Explicit API contracts** with separate Create/Update/Response models

## Troubleshooting

### Types are out of sync
```bash
cd ServerSide && python scripts/sync.py
```

### Pre-commit hook not running
- Ensure the hook is executable: `chmod +x .git/hooks/pre-commit`
- Check that you're committing from the project root

### Type checking errors
- Verify your JSDoc annotations match the generated types
- Run `npm run generate:types` to regenerate from current spec
- Check that backend models have the correct Response variants
