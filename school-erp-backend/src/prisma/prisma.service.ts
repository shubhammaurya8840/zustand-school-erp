import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed-data';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✓ Successfully connected to PostgreSQL (zustand_school_erp)');

      // Auto-bootstrap master data & official accounts on empty database
      const userCount = await this.user.count().catch(() => 0);
      if (userCount === 0) {
        this.logger.log('🌱 Fresh database detected. Auto-seeding official accounts and master curriculum...');
        try {
          await seedDatabase(this);
          this.logger.log('✓ Initial official accounts, classes, and master data auto-seeded successfully!');
        } catch (seedErr) {
          this.logger.error(`Failed to auto-seed database: ${seedErr.message}`, seedErr.stack);
        }
      }
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not connect to PostgreSQL database: ${error.message}. Ensure PostgreSQL is reachable and database exists.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

