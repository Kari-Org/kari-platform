import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Real S3 storage for KYC documents (spec 0005). The `documents` row now holds a
 * stable object key instead of a URL, plus the captured content type and size.
 * The old `url` column only ever held a no-op fake value (Phase 0 storage was a
 * NoopStorageProvider), so a straight rename is safe with no data backfill.
 */
export class RealS3Storage1786300000000 implements MigrationInterface {
  name = 'RealS3Storage1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" RENAME COLUMN "url" TO "objectKey"`);
    await queryRunner.query(`ALTER TABLE "documents" ADD "contentType" character varying(128)`);
    await queryRunner.query(`ALTER TABLE "documents" ADD "sizeBytes" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "sizeBytes"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "contentType"`);
    await queryRunner.query(`ALTER TABLE "documents" RENAME COLUMN "objectKey" TO "url"`);
  }
}
