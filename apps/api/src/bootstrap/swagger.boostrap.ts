import { AUTH_REFERENCE_PATH } from '@app/core/auth';
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
      "HTTP surface for Mario Kreitz's kreitz-webdev platform: multi-tenant website management (CMS session " +
        'auth via Better Auth, using email/password with required verification and GitHub OAuth), importing the ' +
        "signed-in user's GitHub repositories as projects, plus a public read-only API for published projects, " +
        'authenticated per website via a bearer website token. Request and response shapes come from this ' +
        "API's own class-validator DTOs. The Better Auth route reference is served separately at " +
        `${AUTH_REFERENCE_PATH}.`,
    )
    .setVersion('0.0.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setExternalDoc('Better Auth reference', AUTH_REFERENCE_PATH)
    .addTag('Websites', 'Manage websites owned by the authenticated CMS user')
    .addTag('Website Domains', 'Manage domains attached to a website')
    .addTag('Website Tokens', 'Manage bearer tokens used by the public read API')
    .addTag('Website Projects', 'Manage which projects are published on a website')
    .addTag('Projects', "Manage the authenticated user's projects")
    .addTag('GitHub Import', "Browse and import the signed-in user's GitHub repositories as portfolio projects")
    .addTag('Public Projects', 'Public, website-token-authenticated read access to published projects')
    .addTag('Health', 'Liveness and readiness probes')
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
    )
    .addCookieAuth(
      'better-auth.session_token',
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'Better Auth session cookie set on login',
      },
      'session-cookie',
    );

  if (config.isProduction) {
    documentBuilder.addServer(PRODUCTION_API_ORIGIN, 'Production');
  }

  documentBuilder.addServer(localApiOrigin, 'Local development');

  const documentConfig = documentBuilder.build();

  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, documentConfig), {
    customSiteTitle: 'kreitz-webdev API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  return true;
}
