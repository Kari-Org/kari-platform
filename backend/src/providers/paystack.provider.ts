import { createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type {
  ChargeInput,
  ChargeResult,
  ChargeStatus,
  PaymentProvider,
  TransferInput,
  TransferResult,
} from './contracts';

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

/** Paystack returns many status strings; collapse them to our three. */
function mapStatus(s: string | undefined): ChargeStatus {
  if (s === 'success') return 'success';
  if (s === 'failed' || s === 'reversed' || s === 'abandoned') return 'failed';
  return 'pending'; // 'pending' | 'ongoing' | 'otp' | 'processing' | undefined
}

/**
 * Real Paystack implementation of {@link PaymentProvider}. Selected automatically
 * by ProvidersModule when PAYSTACK_SECRET_KEY is set; otherwise the no-op is used.
 * Amounts are kobo (Paystack's native minor unit) — no conversion needed here.
 */
export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = 'paystack';
  private readonly logger = new Logger('PaystackPaymentProvider');
  private readonly base = 'https://api.paystack.co';

  constructor(private readonly secretKey: string) {}

  private async call<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as PaystackEnvelope<T>;
    if (!res.ok || json.status === false) {
      throw new Error(`paystack ${method} ${path} failed: ${json?.message ?? res.statusText}`);
    }
    return json.data;
  }

  async initiateCharge(input: ChargeInput): Promise<ChargeResult> {
    const data = await this.call<{ authorization_url: string; reference: string }>(
      '/transaction/initialize',
      'POST',
      {
        amount: input.amount,
        email: input.email,
        reference: input.reference,
        currency: input.currency ?? 'NGN',
        metadata: input.metadata,
      },
    );
    return { reference: input.reference, authorizationUrl: data.authorization_url, provider: this.name };
  }

  async verifyCharge(reference: string): Promise<ChargeStatus> {
    const data = await this.call<{ status: string }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      'GET',
    );
    return mapStatus(data.status);
  }

  async initiateTransfer(input: TransferInput): Promise<TransferResult> {
    const recipient = await this.call<{ recipient_code: string }>('/transferrecipient', 'POST', {
      type: 'nuban',
      name: input.recipient.name,
      account_number: input.recipient.accountNumber,
      bank_code: input.recipient.bankCode,
      currency: input.currency ?? 'NGN',
    });
    const transfer = await this.call<{ transfer_code: string; status: string }>('/transfer', 'POST', {
      source: 'balance',
      amount: input.amount,
      recipient: recipient.recipient_code,
      reference: input.reference,
      reason: input.reason,
    });
    return {
      reference: input.reference,
      providerRef: transfer.transfer_code,
      status: mapStatus(transfer.status),
      provider: this.name,
    };
  }

  async verifyTransfer(reference: string): Promise<ChargeStatus> {
    const data = await this.call<{ status: string }>(
      `/transfer/verify/${encodeURIComponent(reference)}`,
      'GET',
    );
    return mapStatus(data.status);
  }

  /** Paystack signs webhooks with HMAC-SHA512 of the raw body, keyed by the secret. */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
