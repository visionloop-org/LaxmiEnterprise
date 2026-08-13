@echo off
REM Pre-commit hook to ensure backend changes trigger type regeneration
REM This should be installed as .git/hooks/pre-commit

echo Checking if backend API changes require type regeneration...

REM Check if any backend files were modified
git diff --cached --name-only | findstr /C:"ServerSide\" >nul
if %errorlevel% equ 0 (
    echo Backend files modified. Regenerating OpenAPI spec and types...

    REM Export OpenAPI spec from backend
    cd ServerSide
    python scripts/export_openapi.py
    cd ..

    REM Regenerate TypeScript types
    cd packages\shared
    npm run generate:types
    cd ..\..

    REM Stage the generated files
    git add ServerSide\openapi.json
    git add packages\shared\types\api.ts

    echo OpenAPI spec and types regenerated and staged
)
