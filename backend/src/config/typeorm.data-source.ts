import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.ENV_FILE || '.env';
dotenv.config({
  path: path.isAbsolute(envFile)
    ? envFile
    : path.resolve(process.cwd(), envFile),
});
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildDatabaseOptions } from './database.options';

export default new DataSource(buildDatabaseOptions() as DataSourceOptions);
