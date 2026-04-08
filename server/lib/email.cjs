const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain if available, otherwise fallback to test domain
const FROM_EMAIL = process.env.RESEND_FROM || 'onboarding@resend.dev';

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  process.env.ADMIN_EMAIL_3
].filter(Boolean);

/**
 * Helper to delay execution (to respect rate limits)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send confirmation email to customer
 */
async function sendConfirmationEmail(to, firstName, serviceType, date, time, type, bookingReference) {
  try {
    const subject = type === 'QUOTE'
      ? `[CONFIRMATION] TeleQuote - Revive Property Co.`
      : `[CONFIRMATION] Service Appointment - Revive Property Co.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #121212; color: #fff; padding: 15px; font-weight: bold;">
          BOOKING CONFIRMATION
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Dear ${firstName},</p>
          <p>This electronic record confirms your ${type === 'QUOTE' ? 'TeleQuote Assessment' : 'Service Commencement'} scheduled for ${date} at ${time}.</p>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking Reference:</strong> ${bookingReference}</p>
            <p><strong>Service Discipline:</strong> ${serviceType}</p>
            <p><strong>Location:</strong> Asset Address Registered</p>
          </div>
          <p>Our lead technician, Angus James Gair, will be notified of this project brief.</p>
          <p>A technical summary will be provided 24 hours prior to the window.</p>
          <p>Regards,<br/>Revive Property Co. | Canberra Operations Matrix</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
      return { success: false, error };
    }

    console.log('Confirmation email sent to:', to);
    return { success: true, data };
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send notification email to business owner/admins
 */
async function sendBusinessNotification(type, details) {
  if (ADMIN_EMAILS.length === 0) {
    console.warn('No admin emails configured');
    return { success: false, error: 'No admin emails configured' };
  }

  try {
    let subject = '';
    let html = '';

    switch (type) {
      case 'NEW_BOOKING':
        subject = `[NEW BOOKING] ${details.firstName} ${details.lastName} - ${details.serviceType}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #e74c3c; color: #fff; padding: 15px; font-weight: bold;">
              NEW BOOKING RECEIVED
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <p><strong>Customer:</strong> ${details.firstName} ${details.lastName}</p>
              <p><strong>Email:</strong> ${details.email}</p>
              <p><strong>Phone:</strong> ${details.phone}</p>
              <p><strong>Address:</strong> ${details.address}</p>
              <p><strong>Service:</strong> ${details.serviceType}</p>
              <p><strong>Type:</strong> ${details.type}</p>
              <p><strong>Date/Time:</strong> ${details.date} at ${details.time}</p>
              <p><strong>Booking Reference:</strong> ${details.bookingReference}</p>
              <hr style="margin: 20px 0;"/>
              <p>Please log in to the admin dashboard to manage this booking.</p>
            </div>
          </div>
        `;
        break;

      case 'NEW_CHAT_MESSAGE':
        subject = `[CHAT] New message from ${details.customerName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #3b82f6; color: #fff; padding: 15px; font-weight: bold;">
              NEW CHAT MESSAGE
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <p><strong>Customer:</strong> ${details.customerName}</p>
              <p><strong>Email:</strong> ${details.email || 'N/A'}</p>
              <p><strong>Message:</strong></p>
              <div style="background: #fff; padding: 15px; border-left: 3px solid #3b82f6; margin: 10px 0;">
                ${details.message}
              </div>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `;
        break;

      case 'URGENT_TASK':
        subject = `[URGENT] Task due today: ${details.taskTitle}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f59e0b; color: #fff; padding: 15px; font-weight: bold;">
              URGENT TASK REMINDER
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <p><strong>Task:</strong> ${details.taskTitle}</p>
              <p><strong>Lead:</strong> ${details.leadName || 'N/A'}</p>
              <p><strong>Due:</strong> ${details.dueDate}</p>
              <p><strong>Priority:</strong> ${details.priority || 'Normal'}</p>
              <p style="color: #e74c3c;">⚠️ This task is due TODAY</p>
            </div>
          </div>
        `;
        break;
    }

    const results = [];
    
    // Send sequentially with a small delay to avoid 429 rate limit errors (2 req/s)
    for (const email of ADMIN_EMAILS) {
      try {
        // Add delay between sends if not the first one
        if (results.length > 0) {
          await delay(600); // 600ms delay to stay well under 2 req/s
        }

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject,
          html
        });

        if (error) {
          console.error(`Failed to send business notification to ${email}:`, error);
          results.push({ email, success: false, error });
        } else {
          console.log(`Business notification sent to: ${email}`);
          results.push({ email, success: true, data });
        }
      } catch (err) {
        console.error(`Error sending business notification to ${email}:`, err);
        results.push({ email, success: false, error: err.message });
      }
    }

    const successful = results.filter(r => r.success);
    if (successful.length === 0 && results.length > 0) {
      return { success: false, error: 'All notification attempts failed' };
    }

    return { success: true, count: successful.length };
  } catch (err) {
    console.error('Error sending business notification:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendConfirmationEmail,
  sendBusinessNotification
};
