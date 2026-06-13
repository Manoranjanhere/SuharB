import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

/** Shared Postgres options for Nest + TypeORM CLI migrations. */
export function buildDatabaseOptions(): TypeOrmModuleOptions {
  const synchronize = process.env.DB_SYNCHRONIZE === 'true';
  const migrationsRun = process.env.DB_MIGRATIONS_RUN !== 'false';
  const useSsl = process.env.DB_SSL === 'true';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'sugarbf',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun,
    synchronize,
    logging: process.env.NODE_ENV === 'development',
    ssl: useSsl
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
      : false,
  };
}
