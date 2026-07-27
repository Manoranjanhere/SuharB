import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildDatabaseOptions } from './database.options';

const envFile = process.env.ENV_FILE || '.env';
dotenv.config({
  path: path.isAbsolute(envFile)
    ? envFile
    : path.resolve(process.cwd(), envFile),
});

export default new DataSource(buildDatabaseOptions() as DataSourceOptions);
