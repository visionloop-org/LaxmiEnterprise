@echo off
REM Sync script to export OpenAPI spec and regenerate types
REM Run this after making backend changes

echo Syncing backend API with frontend types...

REM Export OpenAPI spec
python scripts\export_openapi.py

REM Regenerate TypeScript types
cd ..\packages\shared
npm run generate:types
cd ..\..

echo Sync complete!
