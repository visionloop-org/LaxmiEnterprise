#!/bin/bash
# Check if generated types are up to date with the OpenAPI spec
# This script should be run in CI to ensure types are regenerated when the API changes

set -e

echo "Checking if generated types are up to date..."

# Generate types to a temporary file
npx openapi-typescript http://localhost:8000/openapi.json -o /tmp/api.ts.tmp

# Compare with existing types
if diff -q types/api.ts /tmp/api.ts.tmp > /dev/null; then
    echo "✓ Generated types are up to date"
    rm /tmp/api.ts.tmp
    exit 0
else
    echo "✗ Generated types are out of date"
    echo "Please run: npm run generate:types"
    echo "Then commit the updated types/api.ts file"
    rm /tmp/api.ts.tmp
    exit 1
fi
