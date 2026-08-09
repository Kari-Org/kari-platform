import { Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PutObjectInput, StorageProvider } from './contracts';

export interface S3StorageConfig {
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/**
 * Real S3-compatible storage for KYC documents. Selected by ProvidersModule when
 * an endpoint + bucket + keys are present; otherwise the no-op is used.
 *
 * Objects are private: privacy comes from the bucket being private (the Tigris
 * default), NOT from an ACL write parameter — Tigris rejects a PutObject that
 * carries `ACL`. Access is only ever a short-lived signed GET link.
 *
 * Never log document bytes or full signed links; log the key only.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly logger = new Logger('S3StorageProvider');
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      // S3-compatible stores (Tigris) need path-style addressing, not vhost-style.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        // No ACL param: the bucket is private by default and Tigris rejects it.
      }),
    );
    this.logger.log(`putObject key=${input.key}`);
  }

  getSignedUrl(key: string, ttlSeconds: number, contentType?: string | null): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: contentType ?? undefined,
      }),
      { expiresIn: ttlSeconds },
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`deleteObject key=${key}`);
  }
}
