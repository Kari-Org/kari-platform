import type { ValueTransformer } from 'typeorm';

/**
 * Maps a Postgres `bigint` (which the driver returns as a string to avoid
 * precision loss) to a JS `number` and back. Safe for values within ±2^53 —
 * i.e. up to ~90 trillion naira when amounts are stored in kobo — which is far
 * beyond any realistic wallet or platform balance.
 */
export const bigintNumber: ValueTransformer = {
  to: (value?: number | null): string | null | undefined =>
    value === null || value === undefined ? value : String(Math.trunc(value)),
  from: (value?: string | null): number | null | undefined =>
    value === null || value === undefined ? value : Number(value),
};
