# hipages Dashboard - Authentication Fix

## Issue
The hipages dashboard shows "No hipages leads available" because your browser has an old authentication token.

## Solution
1. **Clear your browser's localStorage:**
   - Open DevTools (F12)
   - Go to Application tab → Local Storage
   - Find `revive_admin_token`
   - Delete it
   - Refresh the page

2. **Login with correct credentials:**
   - Username: `admin`
   - Password: `admin`
   - You'll be redirected to `/admin/hipages-leads` with data

## Verification
After logging in, you should see:
- 53 hipages leads in the table
- Customer names, suburbs, job types, credits
- Status filters and search functionality
- Accept lead buttons to convert to CRM leads

## API Status
✅ Backend: Running
✅ Authentication: Working (admin/admin)
✅ Database: 53 leads stored
✅ Real-time sync: Socket.IO configured
✅ Scraper: Active (every 6 hours)
