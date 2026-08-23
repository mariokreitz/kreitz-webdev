import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { BootstrapContext } from './app.boostrap';

export const SWAGGER_PATH = 'api/docs';
export const PRODUCTION_API_ORIGIN = 'https://api.kreitz-webdev.de';

export function setupSwagger(app: INestApplication, context: BootstrapContext): boolean {
  const { config, security } = context;

  if (!security.enableSwagger) {
    return false;
  }

  const localApiOrigin = `http://localhost:${config.port}`;

  const documentBuilder = new DocumentBuilder()
    .setTitle('kreitz-webdev API')
    .setDescription(
      "HTTP surface for Mario Kreitz's kreitz-webdev platform: JWT and GitHub OAuth authentication and user " +
        'account management for the kreitz-webdev Angular clients. Request and response shapes come from this ' +
        "API's own class-validator DTOs.",
    )
    .setVersion('0.0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Website Token',
        name: 'Authorization',
        in: 'header',
        description: 'Website API token',
      },
      'website-token',
    );

  if (config.isProduction) {
    documentBuilder.addServer(PRODUCTION_API_ORIGIN, 'Production');
  }

  documentBuilder.addServer(localApiOrigin, 'Local development');

  const documentConfig = documentBuilder.build();

  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, documentConfig));

  return true;
}
