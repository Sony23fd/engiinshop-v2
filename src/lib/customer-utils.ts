/**
 * Customer identification and grouping utilities
 * Handles phone/account normalization and canonical customer ID generation
 */

/**
 * Normalizes phone numbers by removing all non-digit characters
 * Examples: "99-11-22-33" -> "99112233", "+976 9911 2233" -> "97699112233"
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Validates that a phone number is a real, usable phone number.
 * Rejects: all-same digits (00000000, 11111111), sequential (12345678),
 * too short, or empty values.
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  const digits = normalizePhone(phone);
  
  // Must be exactly 8 digits (Mongolian phone standard)
  if (digits.length !== 8) return false;
  
  // Reject all-same digits: 00000000, 11111111, etc.
  if (/^(\d)\1{7}$/.test(digits)) return false;
  
  // Reject ascending sequence: 12345678
  if (digits === "12345678") return false;
  
  // Reject descending sequence: 87654321
  if (digits === "87654321") return false;
  
  return true;
}

/**
 * Normalizes account numbers by trimming and lowercasing
 * Examples: "  ABC123  " -> "abc123"
 */
export function normalizeAccount(account: string | null | undefined): string {
  if (!account) return "";
  return account.trim().toLowerCase();
}

/**
 * Generates canonical customer identifier for grouping
 * Priority: normalized_phone (if valid) > normalized_account > transactionRef > id
 */
export function getCanonicalCustomerId(order: {
  customerPhone?: string | null;
  accountNumber?: string | null;
  transactionRef?: string | null;
  id: string;
}): string {
  const normalizedPhone = normalizePhone(order.customerPhone);

  // Only group by phone if it's a valid, real phone number
  if (normalizedPhone && isValidPhone(normalizedPhone)) return `phone:${normalizedPhone}`;
  
  const normalizedAccount = normalizeAccount(order.accountNumber);
  if (normalizedAccount) return `account:${normalizedAccount}`;
  if (order.transactionRef) return `txn:${order.transactionRef}`;
  return `order:${order.id}`;
}

/**
 * Groups orders by canonical customer identifier
 */
export function groupOrdersByCustomer(orders: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const order of orders) {
    const key = getCanonicalCustomerId(order);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(order);
  }

  return grouped;
}
