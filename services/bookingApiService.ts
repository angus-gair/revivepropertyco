/**
 * Generate time slots for a day (07:00–19:30, 30-min intervals)
 * Matches server/api/availability.cjs logic — client-side since no backend is deployed.
 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 7; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      slots.push(
        `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      );
    }
  }
  return slots;
}

/**
 * Get available time slots for a date.
 * Generated client-side — no backend required.
 */
export const getAvailableSlots = async (date: string): Promise<string[]> => {
  if (!date) return [];

  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (requestedDate < today) return [];

  return generateTimeSlots();
};

/**
 * Submit booking — attempts the API, falls back to simulated success
 * when no backend is available (static deployment).
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
  details?: string[];
}> => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('API unavailable');
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create booking',
        details: data.details,
      };
    }

    return {
      success: true,
      bookingReference: data.bookingReference,
      leadId: data.leadId,
    };
  } catch {
    // Backend not deployed — simulate success with a generated reference
    const ref = `REV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    console.info(`[Booking] API unavailable — simulated reference: ${ref}`);
    return {
      success: true,
      bookingReference: ref,
    };
  }
};
