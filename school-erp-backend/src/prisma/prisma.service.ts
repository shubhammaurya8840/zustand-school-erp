import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not connect to PostgreSQL database: ${error.message}. Ensure PostgreSQL 17 is running on localhost:5432 and database zustand_school_erp exists.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

