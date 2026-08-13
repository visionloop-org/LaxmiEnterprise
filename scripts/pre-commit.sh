#!/bin/bash
# Pre-commit hook to ensure backend changes trigger type regeneration
# This should be installed as .git/hooks/pre-commit

echo "Checking if backend API changes require type regeneration..."

# Check if any backend files were modified
if git diff --cached --name-only | grep -q "ServerSide/"; then
    echo "Backend files modified. Regenerating OpenAPI spec and types..."

    # Export OpenAPI spec from backend
    cd ServerSide
    python scripts/export_openapi.py
    cd ..

    # Regenerate TypeScript types
    cd packages/shared
    npm run generate:types
    cd ../..

    # Stage the generated files
    git add ServerSide/openapi.json
    git add packages/shared/types/api.ts

    echo "OpenAPI spec and types regenerated and staged"
fi
