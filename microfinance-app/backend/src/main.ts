import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('API Microfinance')
    .setDescription('API complète de gestion de microfinance')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('clients', 'Gestion des clients')
    .addTag('loans', 'Gestion des prêts')
    .addTag('savings', 'Gestion de l\'épargne')
    .addTag('accounting', 'Comptabilité')
    .addTag('reports', 'Rapports et tableaux de bord')
    .addTag('audit', 'Audit et journalisation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation API: http://localhost:${port}/api/docs`);
}

bootstrap();
