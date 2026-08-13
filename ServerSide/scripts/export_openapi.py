#!/usr/bin/env python3
"""
Export FastAPI OpenAPI spec to JSON without running the server.
This script imports the app directly and dumps app.openapi() to a JSON file.
"""

import json
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

try:
    from app.main import app

    # Generate OpenAPI spec
    openapi_spec = app.openapi()

    # Write to JSON file
    output_file = project_root / "openapi.json"
    with open(output_file, "w") as f:
        json.dump(openapi_spec, f, indent=2)

    print(f"OpenAPI spec exported to {output_file}")
    print(f"  {len(openapi_spec.get('paths', {}))} endpoints")
    print(f"  {len(openapi_spec.get('components', {}).get('schemas', {}))} schemas")

except Exception as e:
    print(f"Error exporting OpenAPI spec: {e}", file=sys.stderr)
    sys.exit(1)
