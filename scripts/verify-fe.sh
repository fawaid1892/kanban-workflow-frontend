#!/bin/bash
set -e

echo "=== Kanban Workflow Builder — Frontend Verification ==="
echo ""

PORT=${PORT:-3000}
BASE_URL="http://localhost:${PORT}"

# Check homepage
echo "1. Checking homepage..."
if curl -sf "${BASE_URL}/" > /dev/null 2>&1; then
  echo "   ✅ Homepage accessible"
else
  echo "   ❌ Homepage failed"
  exit 1
fi

# Check workflows page
echo "2. Checking workflows page..."
if curl -sf "${BASE_URL}/workflows" > /dev/null 2>&1; then
  echo "   ✅ Workflows page accessible"
else
  echo "   ❌ Workflows page failed"
  exit 1
fi

# Check build output
echo "3. Checking build output..."
if [ -d ".next" ]; then
  echo "   ✅ Build output exists"
else
  echo "   ⚠️  Build output not found (run npm run build first)"
fi

echo ""
echo "=== Frontend verification complete ==="
