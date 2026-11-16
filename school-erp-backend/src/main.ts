import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('ZustandSchoolERP-Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. CORS Configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
  });

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 3. Global Exception Filter & Response Transformer
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 4. Static Asset Hosting for Uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // 5. Global API Prefix
  app.setGlobalPrefix('api/v1');

  // 6. Swagger / OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Zustand Public School ERP — REST API Engine')
    .setDescription(
      `Dedicated Single-School ERP Console for Zustand Public School.
Motto: Knowledge | Character | Bright Future
Database: zustand_school_erp

Features:
• Complete JWT Role-Based Access Control (Admin, Accountant, Teacher, Librarian, Parent, Student)
• Academic Sessions, Classes (Pre-Nursery to Class 12), Sections & Subjects
• Student Admissions, Full Profiles & Parent Multi-Child Linking
• Staff Directory, Class Teacher Allocations & Weekly Timetable
• Manual Fee Management (Cash/UPI/Bank/Cheque) & Audited Receipts Ledger
• Daily Attendance Roster & Examination Result Processing
• School-Wide Notice Board & Circulation Desk Management
• Immutable Audit Logs & Real-Time Aggregated Reports`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Zustand Public School ERP — API Reference',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=============================================================`);
  logger.log(`🚀 Zustand Public School ERP Backend Engine running on port: ${port}`);
  logger.log(`📚 Swagger OpenAPI Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔗 API Base Endpoint: http://localhost:${port}/api/v1`);
  logger.log(`=============================================================`);
}

bootstrap();

