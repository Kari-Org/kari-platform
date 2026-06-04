import 'reflect-metadata';
import { randomBytes, scryptSync } from 'node:crypto';
import { AdminRole, UserRole, UserStatus } from '@kari/types';
import { User } from '../users/entities/user.entity';
import { AppDataSource } from './data-source';

/** Mirrors PasswordService's scrypt scheme so the seeded admin can log in. */
function hash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@kari.test';
  const phone = process.env.ADMIN_PHONE ?? '+2340000000001';
  const password = process.env.ADMIN_PASSWORD ?? 'AdminPass123!';

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const existing = await repo.findOne({ where: [{ email }, { phone }] });
  if (existing) {
    // Backfill the admin sub-role on a pre-existing admin (column is new).
    if (!existing.adminRole) {
      existing.adminRole = AdminRole.SUPER_ADMIN;
      await repo.save(existing);
      console.log(`backfilled adminRole=SUPER_ADMIN for ${existing.email}`);
    } else {
      console.log(`admin already exists: ${existing.email} (${existing.adminRole})`);
    }
  } else {
    await repo.save(
      repo.create({
        email,
        phone,
        role: UserRole.ADMIN,
        adminRole: AdminRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phoneVerified: true,
        passwordHash: hash(password),
      }),
    );
    console.log(`created admin: ${email} / ${password} (SUPER_ADMIN)`);
  }
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
