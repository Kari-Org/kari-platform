import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { DocumentType, KycStatus } from '@kari/types';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import {
  IDENTITY_PROVIDER,
  LIVENESS_PROVIDER,
  STORAGE_PROVIDER,
  type IdentityProvider,
  type LivenessProvider,
  type LivenessResult,
  type LivenessSession,
  type NinVerificationResult,
  type StorageProvider,
} from '../providers/contracts';
import { Document } from './entities/document.entity';
import { sniffAllowedType } from './mime-sniff';

/** Shape of a multipart upload (subset of multer's file — avoids @types/multer). */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * A stored document as the API exposes it: the persisted fields plus a freshly
 * signed, short-lived `url` and its `expiresAt`. The signed link is never persisted
 * (the row holds only the stable object key); it is generated per response.
 */
export interface DocumentResponse {
  id: string;
  userId: string;
  type: DocumentType;
  status: KycStatus;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
  updatedAt: Date;
  url: string;
  expiresAt: string;
}

/**
 * Identity & KYC: document storage (S3), NIN verification (Dojah), and face
 * liveness (Rekognition) — each via its provider abstraction. Used by both
 * driver onboarding (gating) and rider carpool eligibility.
 */
@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(Document) private readonly docs: Repository<Document>,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(IDENTITY_PROVIDER) private readonly identity: IdentityProvider,
    @Inject(LIVENESS_PROVIDER) private readonly liveness: LivenessProvider,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async uploadDocument(
    userId: string,
    type: DocumentType,
    file: UploadedFile,
  ): Promise<DocumentResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }
    // Trust the bytes, not the client-declared multipart type (trivially spoofed).
    const contentType = sniffAllowedType(file.buffer);
    if (!contentType) {
      throw new UnsupportedMediaTypeException(
        'Unsupported document type; allowed: JPEG, PNG, PDF',
      );
    }
    // Collision-safe, sanitized key (no raw client filename): userId is a uuid and
    // type is an enum value, so nothing user-controlled enters the key path.
    const objectKey = `documents/${userId}/${type}-${randomUUID()}`;
    await this.storage.putObject({ key: objectKey, body: file.buffer, contentType });
    const doc = await this.docs.save(
      this.docs.create({ userId, type, objectKey, contentType, sizeBytes: file.size }),
    );
    return this.toResponse(doc);
  }

  async listDocuments(userId: string): Promise<DocumentResponse[]> {
    const docs = await this.docs.find({ where: { userId } });
    return Promise.all(docs.map((d) => this.toResponse(d)));
  }

  /**
   * Sign a stored document for a response: a fresh short-lived GET link plus the
   * moment it expires. Never persist the link — it is regenerated every read.
   */
  private async toResponse(doc: Document): Promise<DocumentResponse> {
    const ttl = this.config.storage.signedUrlTtlSeconds;
    const url = await this.storage.getSignedUrl(doc.objectKey, ttl, doc.contentType);
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    return {
      id: doc.id,
      userId: doc.userId,
      type: doc.type,
      status: doc.status,
      contentType: doc.contentType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      url,
      expiresAt,
    };
  }

  createLivenessSession(): Promise<LivenessSession> {
    return this.liveness.createSession();
  }

  checkLiveness(sessionId: string): Promise<LivenessResult> {
    return this.liveness.getResult(sessionId);
  }

  verifySelfie(imageBase64: string): Promise<LivenessResult> {
    return this.liveness.verifySelfie(imageBase64);
  }

  verifyNin(nin: string): Promise<NinVerificationResult> {
    return this.identity.verifyNin(nin);
  }
}
