import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Sécurité
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Préfixe API global
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

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

  // Filtres et intercepteurs globaux
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Configuration Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Microfinance Platform API')
    .setDescription(`
      API REST complète pour la gestion de microfinance.
      
      ## Modules
      - **Authentification** : JWT, RBAC, gestion des sessions
      - **Clients** : Personnes physiques, groupes, entreprises
      - **Prêts** : Produits, demandes, décaissements, remboursements
      - **Épargne** : Comptes, dépôts, retraits
      - **Comptabilité** : Plan comptable, écritures, états financiers
      - **Reporting** : Tableaux de bord, indicateurs, exports
      
      ## Authentification
      Utiliser le endpoint /auth/login pour obtenir un token JWT.
      Inclure le token dans le header: Authorization: Bearer <token>
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentification et gestion des sessions')
    .addTag('users', 'Gestion des utilisateurs et rôles')
    .addTag('clients', 'Gestion des clients (individus, groupes, entreprises)')
    .addTag('loans', 'Gestion des prêts et produits de prêts')
    .addTag('savings', 'Gestion de l\'épargne')
    .addTag('accounting', 'Comptabilité et plan comptable')
    .addTag('reports', 'Reporting et tableaux de bord')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║      🏦 Microfinance Platform API                          ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${port}                 ║
║  API Documentation: http://localhost:${port}/docs            ║
║  Environment: ${configService.get('NODE_ENV', 'development').padEnd(12)}                       ║
╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
