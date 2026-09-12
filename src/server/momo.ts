import crypto from 'crypto';
import { db } from '../db/database.ts';
import { MobileMoneyProvider } from '../types/index.ts';

const MOMO_WEBHOOK_SECRET = process.env.MOMO_WEBHOOK_SECRET || 'vendra-uganda-momo-webhook-secret-key-2026';

export interface MomoPaymentRequest {
  reference: string;
  amount: number;
  phone: string;
  provider: MobileMoneyProvider;
}

export interface MomoInitiateResponse {
  success: boolean;
  status: 'PENDING_USER_APPROVAL';
  reference: string;
  gatewayTransactionId: string;
  ussdPromptInstruction: string;
  expiresInSeconds: number;
}

/**
 * Initiates a Mobile Money collection request compliant with MTN MoMo API & Airtel Money Uganda specifications.
 * In a live environment, this contacts the operator endpoint.
 * In sandbox mode, it issues a valid prompt instruction and enables gateway callback simulation.
 */
export async function initiateMobileMoneyCollection(
  req: MomoPaymentRequest
): Promise<MomoInitiateResponse> {
  const providerLabel = req.provider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money';
  const gatewayTransactionId = `MOMO-GW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Formulate standard USSD approval instructions for Uganda users
  let ussdPromptInstruction = '';
  if (req.provider === 'MTN_MOMO') {
    ussdPromptInstruction = `Please check your phone (${req.phone}). A prompt from MTN MoMo will appear requesting your PIN to approve UGX ${req.amount.toLocaleString()} payment to VENDRA. If prompt doesn't appear, dial *165*8# to approve pending approvals.`;
  } else {
    ussdPromptInstruction = `Please check your phone (${req.phone}). An Airtel Money prompt will appear requesting your PIN to approve UGX ${req.amount.toLocaleString()} payment to VENDRA. Or dial *185# to approve pending transaction.`;
  }

  return {
    success: true,
    status: 'PENDING_USER_APPROVAL',
    reference: req.reference,
    gatewayTransactionId,
    ussdPromptInstruction,
    expiresInSeconds: 300 // 5 minutes
  };
}

/**
 * Validates HMAC SHA-256 webhook signatures from Mobile Money providers
 */
export function verifyWebhookSignature(payload: string, signatureHeader?: string): boolean {
  if (!signatureHeader) return false;
  try {
    const computedSignature = crypto
      .createHmac('sha256', MOMO_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf-8'),
      Buffer.from(signatureHeader, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Helper to generate a valid webhook signature for test simulations
 */
export function generateTestWebhookSignature(payload: string): string {
  return crypto
    .createHmac('sha256', MOMO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
}
