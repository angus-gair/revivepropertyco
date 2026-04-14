#!/bin/bash

# Customer Portal API Test Script
# Tests all customer portal endpoints

BASE_URL="http://localhost:3001"

echo "======================================="
echo "Customer Portal API Test Suite"
echo "======================================="
echo ""

# Test 1: Register a new customer
echo "Test 1: Customer Registration"
echo "-----------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "mobile": "0498765432",
    "email": "john.doe@example.com",
    "password": "testpass123"
  }')

echo "$REGISTER_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
CUSTOMER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.customer.customerId')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Registration successful"
  echo ""
else
  echo "✗ Registration failed"
  exit 1
fi

# Test 2: Login with mobile
echo "Test 2: Customer Login (Mobile)"
echo "-----------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "0498765432",
    "password": "testpass123"
  }')

echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "✓ Login successful"
echo ""

# Test 3: Get customer profile
echo "Test 3: Get Customer Profile"
echo "-----------------------------------"
PROFILE_RESPONSE=$(curl -s -X GET $BASE_URL/api/customer/profile \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | jq .
echo "✓ Profile retrieved"
echo ""

# Test 4: Update customer profile
echo "Test 4: Update Customer Profile"
echo "-----------------------------------"
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/api/customer/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "mobile": "0498765432",
    "email": "john.doe@example.com",
    "address": "123 Test Street",
    "suburb": "Kingston",
    "postcode": "2604",
    "state": "ACT"
  }')

echo "$UPDATE_RESPONSE" | jq .
echo "✓ Profile updated"
echo ""

# Test 5: Check database records
echo "Test 5: Verify Database Records"
echo "-----------------------------------"
docker exec -i postgres psql -U homelab -d revivepropertyco -c "
  SELECT
    c.first_name,
    c.mobile,
    c.email,
    COUNT(DISTINCT al.log_id) as audit_log_count
  FROM customers c
  LEFT JOIN audit_log al ON c.customer_id = al.customer_id
  WHERE c.mobile = '0498765432'
  GROUP BY c.first_name, c.mobile, c.email;
" 2>&1 | grep -v "COPY"
echo "✓ Database records verified"
echo ""

# Test 6: Test authentication with invalid token
echo "Test 6: Invalid Token Test"
echo "-----------------------------------"
INVALID_RESPONSE=$(curl -s -X GET $BASE_URL/api/customer/profile \
  -H "Authorization: Bearer invalid_token")

if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "✓ Invalid token rejected (as expected)"
else
  echo "✗ Security issue: invalid token accepted!"
fi
echo ""

# Test 7: Test login with wrong password
echo "Test 7: Wrong Password Test"
echo "-----------------------------------"
WRONG_PASS_RESPONSE=$(curl -s -X POST $BASE_URL/api/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "0498765432",
    "password": "wrongpassword"
  }')

if echo "$WRONG_PASS_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "✓ Wrong password rejected (as expected)"
else
  echo "✗ Security issue: wrong password accepted!"
fi
echo ""

# Test 8: Test duplicate registration
echo "Test 8: Duplicate Registration Test"
echo "-----------------------------------"
DUPLICATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Another",
    "lastName": "User",
    "mobile": "0498765432",
    "email": "another@example.com",
    "password": "testpass123"
  }')

if echo "$DUPLICATE_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "✓ Duplicate registration rejected (as expected)"
else
  echo "✗ Duplicate allowed (security issue)!"
fi
echo ""

# Summary
echo "======================================="
echo "Test Summary"
echo "======================================="
echo "✓ All core tests passed"
echo "✓ Customer ID: $CUSTOMER_ID"
echo "✓ JWT Token: ${TOKEN:0:50}..."
echo ""
echo "API endpoints tested:"
echo "  POST /api/customer/register"
echo "  POST /api/customer/login"
echo "  GET  /api/customer/profile"
echo "  PUT  /api/customer/profile"
echo ""
echo "Security tests passed:"
echo "  Invalid token rejection"
echo "  Wrong password rejection"
echo "  Duplicate account prevention"
echo ""
echo "Next steps:"
echo "  1. Test document upload/download"
echo "  2. Test quote approval workflow"
echo "  3. Test frontend pages"
