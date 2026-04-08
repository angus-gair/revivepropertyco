
import { ServiceType, AppointmentType } from '../types';

interface EmailParams {
  to: string;
  firstName: string;
  serviceType: ServiceType;
  date: string;
  time: string;
  type: AppointmentType;
}

/**
 * Simulates sending a professional confirmation email.
 * In production, this would bridge to SendGrid, Postmark, or AWS SES.
 */
export const sendConfirmationEmail = async (params: EmailParams): Promise<boolean> => {
  console.log("%c ARCHITECTURAL EMAIL TRANSMISSION ", "background: #121212; color: #fff; padding: 5px; font-weight: bold;");
  console.log(`Target: ${params.to}`);
  console.log(`Subject: [CONFIRMATION] ${params.type === 'QUOTE' ? 'TeleQuote' : 'Service Appointment'} - Revive Property Co.`);
  console.log(`
    Dear ${params.firstName},

    This electronic record confirms your ${params.type === 'QUOTE' ? 'TeleQuote Assessment' : 'Service Commencement'} 
    scheduled for ${params.date} at ${params.time}.

    SERVICE DISCIPLINE: ${params.serviceType}
    LOCATION: Asset Address Registered
    
    Our lead technician, Angus James Gair, will be notified of this project brief. 
    A technical summary will be provided 24 hours prior to the window.

    Regards,
    Revive Property Co. | Canberra Operations Matrix
  `);

  // Simulate network latency of a mail server
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1500);
  });
};
