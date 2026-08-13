@echo off
REM Check if generated types are up to date with the OpenAPI spec
REM This script should be run in CI to ensure types are regenerated when the API changes

echo Checking if generated types are up to date...

REM Generate types to a temporary file
npx openapi-typescript http://localhost:8000/openapi.json -o %TEMP%\api.ts.tmp

REM Compare with existing types (using fc command for file comparison)
fc /B types\api.ts %TEMP%\api.ts.tmp >nul
if %errorlevel% equ 0 (
    echo Generated types are up to date
    del %TEMP%\api.ts.tmp
    exit /b 0
) else (
    echo Generated types are out of date
    echo Please run: npm run generate:types
    echo Then commit the updated types\api.ts file
    del %TEMP%\api.ts.tmp
    exit /b 1
)
