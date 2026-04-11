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
 * Normalizes account numbers by trimming and lowercasing
 * Examples: "  ABC123  " -> "abc123"
 */
export function normalizeAccount(account: string | null | undefined): string {
  if (!account) return "";
  return account.trim().toLowerCase();
}

/**
 * Generates canonical customer identifier for grouping
 * Priority: normalized_phone > normalized_account > transactionRef > id
 */
export function getCanonicalCustomerId(order: {
  customerPhone?: string | null;
  accountNumber?: string | null;
  transactionRef?: string | null;
  id: string;
}): string {
  const normalizedPhone = normalizePhone(order.customerPhone);
  const normalizedAccount = normalizeAccount(order.accountNumber);

  if (normalizedPhone) return `phone:${normalizedPhone}`;
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
