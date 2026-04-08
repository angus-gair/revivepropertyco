#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests the Resend email integration before deployment
 */

const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const { Resend } = require('resend');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

console.log(`${GREEN}══════════════════════════════════════${NC}`);
console.log(`${GREEN}📧  Revive Property Co. - Email Service Test${NC}`);
console.log(`${GREEN}══════════════════════════════════════${NC}`);
console.log('');

// ========================================
// Configuration
// ========================================
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM || 'no-reply@revivepropertyco.au';

if (!RESEND_API_KEY || RESEND_API_KEY === 're_YOUR_KEY_HERE') {
  console.log(`${RED}❌ ERROR: No valid Resend API key found${NC}`);
  console.log(`${YELLOW}Please set RESEND_API_KEY in .env.production${NC}`);
  console.log('');
  console.log(`${YELLOW}Example:${NC}`);
  console.log('RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx');
  process.exit(1);
}

console.log(`${GREEN}✅ Resend API Key: ${RESEND_API_KEY.substring(0, 10)}...${NC}`);
console.log(`${GREEN}✅ From Email: ${FROM_EMAIL}${NC}`);
console.log('');

const resend = new Resend(RESEND_API_KEY);

// ========================================
// Test Functions
// ========================================

/**
 * Test 1: Simple text email
 */
async function testSimpleEmail() {
  console.log(`${YELLOW}Test 1: Simple text email...${NC}`);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'angus@gair.com.au',
      subject: '📧 Revive Property Co. - Email Service Test',
      text: 'This is a test email from the Revive Property Co. booking system.\n\nIf you receive this, the email service is working correctly!'
    });

    if (result.error) {
      console.log(`${RED}❌ Failed:${NC}`);
      console.log(`${RED}   ${result.error.message}${NC}`);
      return false;
    }

    console.log(`${GREEN}✅ Success!${NC}`);
    console.log(`${GREEN}   Message ID: ${result.data.id}${NC}`);
    console.log(`${GREEN}   To: ${result.data.to}${NC}`);
    return true;
  } catch (error) {
    console.log(`${RED}❌ Exception:${NC}`);
    console.log(`${RED}   ${error.message}${NC}`);
    return false;
  }
}

/**
 * Test 2: HTML email with customer confirmation template
 */
async function testCustomerConfirmation() {
  console.log(`${YELLOW}Test 2: Customer confirmation email (HTML)...${NC}`);

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #121212; color: #fff; padding: 15px; font-weight: bold;">
          BOOKING CONFIRMATION
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Dear Angus,</p>
          <p>This is a <strong>test email</strong> for the Revive Property Co. booking system.</p>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking Reference:</strong> TEST-BOOKING-001</p>
            <p><strong>Service Discipline:</strong> Pressure Washing</p>
            <p><strong>Location:</strong> Test Address, Canberra</p>
            <p><strong>Arrival Window:</strong> 2026-03-15 at 08:00</p>
          </div>
          <p>Regards,<br/>Revive Property Co. | Canberra Operations Matrix</p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'angus@gair.com.au',
      subject: '[CONFIRMATION] TeleQuote - Revive Property Co.',
      html
    });

    if (result.error) {
      console.log(`${RED}❌ Failed:${NC}`);
      console.log(`${RED}   ${result.error.message}${NC}`);
      return false;
    }

    console.log(`${GREEN}✅ Success!${NC}`);
    console.log(`${GREEN}   Message ID: ${result.data.id}${NC}`);
    return true;
  } catch (error) {
    console.log(`${RED}❌ Exception:${NC}`);
    console.log(`${RED}   ${error.message}${NC}`);
    return false;
  }
}

/**
 * Test 3: Business notification (all 3 admins)
 */
async function testBusinessNotification() {
  console.log(`${YELLOW}Test 3: Business notification (multiple recipients)...${NC}`);

  const adminEmails = [
    process.env.ADMIN_EMAIL_1 || 'angus@gair.com.au',
    process.env.ADMIN_EMAIL_2 || 'angusjames@gair.com.au',
    process.env.ADMIN_EMAIL_3 || 'angus@ajinsights.com.au'
  ].filter(Boolean);

  if (adminEmails.length === 0) {
    console.log(`${RED}❌ No admin emails configured${NC}`);
    return false;
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #e74c3c; color: #fff; padding: 15px; font-weight: bold;">
          NEW BOOKING RECEIVED
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p><strong>Customer:</strong> Test Customer</p>
          <p><strong>Email:</strong> test@example.com</p>
          <p><strong>Phone:</strong> 0412345678</p>
          <p><strong>Address:</strong> Test Location, Canberra</p>
          <p><strong>Service:</strong> Pressure Washing</p>
          <p><strong>Type:</strong> JOB</p>
          <p><strong>Date/Time:</strong> 2026-03-15 at 08:00</p>
          <p><strong>Booking Reference:</strong> TEST-BOOKING-002</p>
          <hr style="margin: 20px 0;"/>
          <p>Please log in to the admin dashboard to manage this booking.</p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmails,
      subject: '[NEW BOOKING] Test Customer - Pressure Washing',
      html
    });

    if (result.error) {
      console.log(`${RED}❌ Failed:${NC}`);
      console.log(`${RED}   ${result.error.message}${NC}`);
      return false;
    }

    console.log(`${GREEN}✅ Success!${NC}`);
    console.log(`${GREEN}   Sent to ${adminEmails.length} recipients${NC}`);
    console.log(`${GREEN}   Message ID: ${result.data.id}${NC}`);
    return true;
  } catch (error) {
    console.log(`${RED}❌ Exception:${NC}`);
    console.log(`${RED}   ${error.message}${NC}`);
    return false;
  }
}

/**
 * Test 4: Check API quota
 */
async function testApiQuota() {
  console.log(`${YELLOW}Test 4: Checking Resend API quota...${NC}`);

  try {
    const response = await fetch('https://api.resend.com/emails/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`${RED}❌ Failed to fetch quota${NC}`);
      return false;
    }

    const data = await response.json();

    console.log(`${GREEN}✅ Quota Check Successful${NC}`);
    console.log(`${GREEN}   Remaining Credits: ${data.remaining}${NC}`);
    console.log(`${GREEN}   Total Credits: ${data.limit || 'N/A'}${NC}`);

    if (data.remaining > 2000) {
      console.log(`${GREEN}✅ Sufficient credits for production${NC}`);
    } else {
      console.log(`${YELLOW}⚠️  Warning: Low credits. Consider upgrading before full deployment.${NC}`);
    }

    return true;
  } catch (error) {
    console.log(`${RED}❌ Quota check failed${NC}`);
    console.log(`${YELLOW}   Note: Resend free tier includes 3,000 emails/month${NC}`);
    return false;
  }
}

// ========================================
// Run Tests
// ========================================

async function runAllTests() {
  console.log('');
  console.log(`${GREEN}───────────────────────────────────${NC}`);
  console.log(`${GREEN}Running Email Service Tests${NC}`);
  console.log(`${GREEN}───────────────────────────────────${NC}`);
  console.log('');

  const results = {
    simpleEmail: false,
    customerConfirmation: false,
    businessNotification: false,
    apiQuota: false
  };

  // Test 1: Simple email
  results.simpleEmail = await testSimpleEmail();
  console.log('');

  // Test 2: Customer confirmation template
  results.customerConfirmation = await testCustomerConfirmation();
  console.log('');

  // Test 3: Business notification
  results.businessNotification = await testBusinessNotification();
  console.log('');

  // Test 4: API quota
  results.apiQuota = await testApiQuota();
  console.log('');

  // ========================================
  // Results Summary
  // ========================================
  console.log(`${GREEN}════════════════════════════════════${NC}`);
  console.log(`${GREEN}📊 Test Results Summary${NC}`);
  console.log(`${GREEN}══════════════════════════════════${NC}`);
  console.log('');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log(`${GREEN}✅ ALL TESTS PASSED!${NC}`);
    console.log('');
    console.log(`${GREEN}The email service is working correctly and ready for deployment.${NC}`);
    console.log('');
    console.log(`${YELLOW}Next step:${NC}`);
    console.log(`  ${YELLOW}Run: ${NC} ./deploy.sh${NC}`);
  console.log('');
    console.log(`${YELLOW}Or manually:${NC}`);
    console.log(`  ${YELLOW}docker-compose -f docker-compose.production.yml up -d${NC}`);
  } else {
    console.log(`${RED}❌ SOME TESTS FAILED${NC}`);
    console.log('');
    console.log(`${RED}Failed tests:${NC}`);
    Object.entries(results).forEach(([test, passed]) => {
      if (!passed) {
        console.log(`${RED}  ✗ ${test}${NC}`);
      }
    });
    console.log('');
    console.log(`${YELLOW}Please review the errors above and check:${NC}`);
    console.log(`  1. Your Resend API key is correct`);
    console.log(`  2. Your FROM_EMAIL is valid (not blocked by Resend)`);
    console.log(`  3. No network connectivity issues`);
  }
}

runAllTests().catch(error => {
  console.error(`${RED}Fatal error running tests:${NC}`, error);
  process.exit(1);
});
