#!/bin/bash

# Simple test script for deployed Monobank function
echo "🧪 Testing deployed Monobank payment function..."

# Get the Supabase project URL
PROJECT_URL="https://zoezuvdsebnnbrwziosb.supabase.co"

echo "Testing create action..."
curl -X POST "$PROJECT_URL/functions/v1/monopay?action=create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "amount": 100.50,
    "orderId": "test-001",
    "redirectUrl": "http://localhost:5173/payment/test-001"
  }'

echo -e "\n\nTesting create-part action..."
curl -X POST "$PROJECT_URL/functions/v1/monopay?action=create-part" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "amount": 200.75,
    "orderId": "test-002",
    "partsCount": 3
  }'

echo -e "\n\nTesting invalid action..."
curl -X POST "$PROJECT_URL/functions/v1/monopay?action=invalid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{}'

echo -e "\n\n🎉 Tests completed!"