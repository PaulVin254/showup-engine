/**
 * Normalizes Kenyan & East African phone numbers to strict E.164 digits without '+'
 * Examples:
 * - "0712 345 678"   -> "254712345678"
 * - "+254712345678"  -> "254712345678"
 * - "712345678"      -> "254712345678"
 * - "0110 123 456"   -> "254110123456"
 */
export function normalizeKenyanPhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");

  // Case 1: 07XXXXXXXX or 01XXXXXXXX (10 digits)
  if (digits.length === 10 && (digits.startsWith("07") || digits.startsWith("01"))) {
    return `254${digits.slice(1)}`;
  }

  // Case 2: 7XXXXXXXX or 1XXXXXXXX (9 digits)
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    return `254${digits}`;
  }

  // Case 3: 2547XXXXXXXX or 2541XXXXXXXX (12 digits)
  if (digits.length === 12 && (digits.startsWith("2547") || digits.startsWith("2541"))) {
    return digits;
  }

  // Case 4: International E.164 (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function formatPhoneDisplay(e164: string): string {
  if (!e164) return "";
  const clean = e164.replace(/\D/g, "");
  if (clean.startsWith("254") && clean.length === 12) {
    return `+254 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return `+${clean}`;
}

