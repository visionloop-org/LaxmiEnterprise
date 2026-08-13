#!/usr/bin/env python3
"""
Sync script to export OpenAPI spec and regenerate frontend types.
Run this after making backend changes to keep frontend types in sync.
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return success status"""
    try:
        subprocess.run(cmd, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return False

def main():
    # Since this script is in ServerSide/scripts, project root is two levels up
    server_side = Path(__file__).parent.parent
    shared = server_side.parent / "packages" / "shared"

    print("Syncing backend API with frontend types...")

    # Export OpenAPI spec
    print("1. Exporting OpenAPI spec...")
    if not run_command("python scripts/export_openapi.py", cwd=server_side):
        print("Failed to export OpenAPI spec")
        sys.exit(1)

    # Regenerate TypeScript types
    print("2. Regenerating TypeScript types...")
    if not run_command("npm run generate:types", cwd=shared):
        print("Failed to generate TypeScript types")
        sys.exit(1)

    print("Sync complete!")
    print(f"  OpenAPI spec: {server_side / 'openapi.json'}")
    print(f"  TypeScript types: {shared / 'types' / 'api.ts'}")

if __name__ == "__main__":
    main()
