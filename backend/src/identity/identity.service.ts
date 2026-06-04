import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { DocumentType } from '@kari/types';
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

/** Shape of a multipart upload (subset of multer's file — avoids @types/multer). */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
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
  ) {}

  async uploadDocument(userId: string, type: DocumentType, file: UploadedFile): Promise<Document> {
    const key = `documents/${userId}/${type}-${Date.now()}-${file.originalname}`;
    const { url } = await this.storage.putObject({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });
    return this.docs.save(this.docs.create({ userId, type, url }));
  }

  listDocuments(userId: string): Promise<Document[]> {
    return this.docs.find({ where: { userId } });
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
