import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildDatabaseOptions } from './database.options';

export default new DataSource(buildDatabaseOptions() as DataSourceOptions);
