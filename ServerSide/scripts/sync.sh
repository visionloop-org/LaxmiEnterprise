#!/bin/bash
# Sync script to export OpenAPI spec and regenerate types
# Run this after making backend changes

echo "Syncing backend API with frontend types..."

# Export OpenAPI spec
python scripts/export_openapi.py

# Regenerate TypeScript types
cd ../packages/shared
npm run generate:types
cd ../..

echo "Sync complete!"
