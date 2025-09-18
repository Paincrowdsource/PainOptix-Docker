import { toZonedTime, format } from 'date-fns-tz';

interface SendWindowResult {
  allowed: boolean;
  localTime: string;
  reason?: string;
}

/**
 * Check if current time is within the send window for a given timezone
 * Handles DST transitions correctly using date-fns-tz
 * @param date The date/time to check (defaults to now)
 * @param timezone IANA timezone string (e.g., 'America/New_York')
 * @param window Time window in HH:MM-HH:MM format (e.g., '08:00-20:00')
 * @returns Object with allowed flag, local time, and reason if blocked
 */
export function isWithinSendWindow(
  date: Date,
  timezone: string,
  window: string
): SendWindowResult {
  try {
    // Handle missing or empty window
    if (!window || window.trim() === '') {
      return {
        allowed: true,
        localTime: '',
        reason: 'No window specified - allowing send'
      };
    }

    // Parse window format (HH:MM-HH:MM)
    const windowMatch = window.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
    if (!windowMatch) {
      return {
        allowed: true,
        localTime: '',
        reason: 'Invalid window format - allowing send'
      };
    }

    const [, startHour, startMin, endHour, endMin] = windowMatch;
    const windowStart = {
      hour: parseInt(startHour, 10),
      minute: parseInt(startMin, 10)
    };
    const windowEnd = {
      hour: parseInt(endHour, 10),
      minute: parseInt(endMin, 10)
    };

    // Convert to target timezone
    const zonedDate = toZonedTime(date, timezone);
    const localHour = zonedDate.getHours();
    const localMinute = zonedDate.getMinutes();
    const localTime = format(zonedDate, 'HH:mm', { timeZone: timezone });

    // Convert times to minutes for easier comparison
    const currentMinutes = localHour * 60 + localMinute;
    const startMinutes = windowStart.hour * 60 + windowStart.minute;
    const endMinutes = windowEnd.hour * 60 + windowEnd.minute;

    // Check if within window (handle both same-day and cross-midnight windows)
    let isWithin: boolean;
    if (startMinutes <= endMinutes) {
      // Same day window (e.g., 08:00-20:00)
      isWithin = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Cross-midnight window (e.g., 20:00-08:00)
      isWithin = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    if (!isWithin) {
      let reason: string;
      if (currentMinutes < startMinutes) {
        reason = `Outside send window - ${localTime} is before window start ${window.split('-')[0]}`;
      } else {
        reason = `Outside send window - ${localTime} is after window end ${window.split('-')[1]}`;
      }

      return {
        allowed: false,
        localTime,
        reason
      };
    }

    return {
      allowed: true,
      localTime
    };
  } catch (error: any) {
    // If timezone processing fails, default to allowing
    console.error('Error checking send window:', error);
    return {
      allowed: true,
      localTime: '',
      reason: `Error processing timezone: ${error.message}`
    };
  }
}

/**
 * Check if a date is before a start date
 * @param date The date to check
 * @param startDate The start date (ISO string)
 * @returns true if date is before startDate
 */
export function isBeforeStartDate(date: Date, startDate: string | undefined): boolean {
  if (!startDate) {
    return false;
  }

  try {
    const start = new Date(startDate);
    return date < start;
  } catch (error) {
    console.error('Error parsing start date:', error);
    return false;
  }
}