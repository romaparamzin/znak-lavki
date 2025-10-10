/**
 * Mark Status Enum
 * Defines all possible states of a quality mark
 */
export enum MarkStatus {
  /** Mark is active and can be used */
  ACTIVE = 'active',
  
  /** Mark is blocked and cannot be used */
  BLOCKED = 'blocked',
  
  /** Mark has expired based on product expiry date */
  EXPIRED = 'expired',
  
  /** Mark has been used/activated by consumer */
  USED = 'used',
}

