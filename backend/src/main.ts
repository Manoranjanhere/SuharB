import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new MulterExceptionFilter());

  // Log uploads and other mutating requests (helps debug EC2 with docker logs)
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.originalUrl || req.url;
    const shouldLog =
      req.method !== 'GET' || path.includes('/photos') || path.includes('/verify/');
    res.on('finish', () => {
      if (shouldLog) {
        const ms = Date.now() - start;
        console.log(`[HTTP] ${req.method} ${path} ${res.statusCode} ${ms}ms`);
      }
    });
    next();
  });

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation pipe — strip unknown fields, transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SugarBf API')
    .setDescription('Backend API for SugarBf — premium lifestyle matching app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    (err: { message?: string }, _req: unknown, res: any, next: (err?: unknown) => void) => {
      if (res.headersSent) {
        return next(err);
      }
      const msg = err?.message ?? '';
      if (msg.includes('images are allowed')) {
        console.warn('[upload rejected]', msg);
        return res.status(400).json({ statusCode: 400, message: msg });
      }
      next(err);
    },
  );

  await app.listen(port, '0.0.0.0');

  if (!process.env.AWS_S3_BUCKET) {
    console.warn('⚠️  AWS_S3_BUCKET is not set — photo uploads will fail');
  }

  console.log(`🚀 SugarBf API running at: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
