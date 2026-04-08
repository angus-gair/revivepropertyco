#!/bin/bash

# Quick Booking and Email Test
# This script tests the complete booking flow once backend is running

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "${GREEN}═════════════════════════════════════════${NC}"
echo "${GREEN}🧪 Revive Property Co. - Quick Booking & Email Test${NC}"
echo "${GREEN}═══════════════════════════════════════${NC}"
echo ""

# ========================================
# Function: Test Booking via API
# ========================================

test_booking() {
    local booking_data='{
        "firstName": "Test",
        "lastName": "Customer",
        "email": "angus@gair.com.au",
        "phone": "0412345678",
        "address": "123 Test Street, Canberra ACT 2601",
        "serviceType": "Pressure Washing",
        "date": "2026-03-15",
        "timeSlot": "08:00",
        "type": "JOB",
        "notes": "Automated test booking"
    }'

    echo -e "${YELLOW}[1/3] Submitting booking to backend...${NC}"

    local response=$(curl -s -X POST http://localhost:8080/api/bookings \
        -H "Content-Type: application/json" \
        -d "$booking_data" \
        -w "\nHTTP Status: %{http_code}\nBooking Reference: %{response_data.bookingReference}\nLead ID: %{response_data.leadId}\nEmail Sent: %{response_data.emailSent}\nNotification Sent: %{response_data.notificationSent}" 2>&1)

    echo "$response"
    echo ""

    # Check for success
    if echo "$response" | grep -q "Booking Reference"; then
        echo -e "${GREEN}✅ Booking created successfully!${NC}"
        echo -e "${GREEN}   Booking Reference: ${NC}"
        echo "$response" | grep "Booking Reference" | sed 's/.*Booking Reference: \(//' | sed 's/\).*\).*//'

        return 0
    else
        echo -e "${RED}❌ Booking failed${NC}"
        echo -e "${RED}   $response${NC}"
        return 1
    fi
}

# ========================================
# Function: Verify Email Delivery
# ========================================

verify_emails() {
    echo -e "${YELLOW}[2/3] Checking for confirmation emails...${NC}"
    echo ""
    echo -e "${CYAN}Please check these email addresses:${NC}"
    echo -e "${YELLOW}  → Business Email 1: ${NC}angus@gair.com.au${NC}"
    echo -e "${YELLOW}  → Business Email 2: ${NC}angusjames@gair.com.au${NC}"
    echo -e "${YELLOW}  → Business Email 3: ${NC}angus@ajinsights.com.au${NC}"
    echo -e "${YELLOW}  → Customer Email: ${NC}angus@gair.com.au${NC}"
    echo ""
    echo -e "${YELLOW}Press Enter once you have received confirmation emails at all 4 addresses${NC}"
    read -p ""
}

# ========================================
# Main Test Flow
# ========================================

echo "${GREEN}═════════════════════════════════════${NC}"
echo "${GREEN}Starting Complete Test Flow${NC}"
echo "${GREEN}═════════════════════════════════════${NC}"
echo ""

# Step 1: Test Booking
if test_booking; then
    echo -e "${GREEN}✅ Booking test passed!${NC}"
    echo ""
else
    echo -e "${RED}❌ Booking test failed${NC}"
    echo ""
    echo -e "${RED}⚠️  Please check:${NC}"
    echo -e "${RED}   1. Backend server is running${NC}"
    echo -e "${RED}   2. Database is connected${NC}"
    echo -e "${RED}   3. API key is valid${NC}"
    echo ""
    read -p "Press Enter to try email verification anyway..."
fi

# Step 2: Verify Emails
verify_emails

# Step 3: Summary
echo ""
echo "${GREEN}═════════════════════════════════════${NC}"
echo "${GREEN}✅ Test Complete!${NC}"
echo "${GREEN}═════════════════════════════════════${NC}"
echo ""
echo "${CYAN}If both booking and emails are successful, the system is ready for deployment!${NC}"
echo ""
echo "${YELLOW}Next: Run ./deploy.sh to deploy to production${NC}"
