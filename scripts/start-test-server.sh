#!/bin/bash
# Start the Order Engine Playwright Test Runner
# No compilation - pure Node.js

cd "$(dirname "$0")/.."
echo "Starting Order Engine Test Runner at http://localhost:8080"
(sleep 2 && (open http://localhost:8080 2>/dev/null || xdg-open http://localhost:8080 2>/dev/null || echo "Open http://localhost:8080 in your browser")) &
exec node scripts/test-server.js
