
import { registerAs } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[Configuration Error] Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getDatabasePort(): number {
  const port = Number(getRequiredEnv('DB_PORT'));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      '[Configuration Error] DB_PORT must be a valid port number.',
    );
  }

  return port;
}

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const databaseName = getRequiredEnv('DB_NAME');
    const isTest = nodeEnv === 'test';

    // Never allow dropSchema to run against a non-test database.
    if (isTest && !databaseName.endsWith('_test')) {
      throw new Error(
        '[Database Safety Error] Refusing to enable dropSchema. ' +
        'The test database name must end with "_test".',
      );
    }

    return {
      type: 'postgres',
      host: getRequiredEnv('DB_HOST'),
      port: getDatabasePort(),
      username: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: databaseName,

      autoLoadEntities: true,

      // Development and isolated test databases only.
      synchronize: nodeEnv === 'development' || isTest,

      // Destructive schema reset is permitted only for the test DB.
      dropSchema: isTest,
    };
  },
);
