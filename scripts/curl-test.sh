#!/bin/bash

echo "📡 TESTING MONOBANK FUNCTION WITH CURL"
echo "===================================="

PROJECT_URL="https://zoezuvdsebnnbrwziosb.supabase.co"
SERVICE_KEY="sb_secret_p9oQsG-4xJH4MSq7qOX0NQ_nV-LXnwj"

echo "Testing monopay function with verbose output..."
echo "================================================"

echo "📋 Test 1: Standard payment creation"
curl -v -X POST "$PROJECT_URL/functions/v1/monopay?action=create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{
    "amount": 100.50,
    "orderId": "curl-test-001",
    "redirectUrl": "http://localhost:5173/payment/curl-test-001"
  }'

echo -e "\n\n📋 Test 2: Parts payment creation"
curl -v -X POST "$PROJECT_URL/functions/v1/monopay?action=create-part" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{
    "amount": 200.75,
    "orderId": "curl-test-002",
    "partsCount": 3
  }'

echo -e "\n\n📋 Test 3: Invalid action"
curl -v -X POST "$PROJECT_URL/functions/v1/monopay?action=invalid" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{}'

echo -e "\n\n✅ All tests completed!"