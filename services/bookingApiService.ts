const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

/**
 * Get available time slots for a date
 */
export const getAvailableSlots = async (date: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/api/availability?date=${date}`);

  if (!response.ok) {
    console.error('Failed to fetch availability:', response.status);
    return [];
  }

  const data = await response.json();
  return data.slots || [];
};

/**
 * Submit booking to backend
 */
export const submitBooking = async (bookingData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  date: string;
  timeSlot: string;
  type: 'QUOTE' | 'JOB';
  notes?: string;
  platformPreference?: string;
}): Promise<{
  success: boolean;
  bookingReference?: string;
  leadId?: string;
  error?: string;
}> => {
  const response = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookingData)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Booking failed:', data);
    return {
      success: false,
      error: data.error || 'Failed to create booking',
      details: data.details
    };
  }

  return {
    success: true,
    bookingReference: data.bookingReference,
    leadId: data.leadId
  };
};
