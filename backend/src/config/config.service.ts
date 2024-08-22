import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as Joi from 'joi';
import { AbstractConfigService, AbstractConfigServiceSchema } from './AbstractConfigService';

import { switchEnv } from './switchEnv';

dotenvExpand.expand(dotenv.config());

/**
 * Configuration validation schema - when changing the configuration, adjust this first,
 * then change the ConfigService until the config instance validates
 */
const CONFIG_SCHEMA = AbstractConfigServiceSchema.keys({
  httpPort: Joi.number().integer().greater(0).required(),

  database: Joi.object().keys({
    host: Joi.string().required(),
    port: Joi.number().integer().greater(0).required(),
    user: Joi.string().required(),
    pass: Joi.string().required(),
    name: Joi.string().required(),
    ssl: Joi.boolean().required(),
  }),
});

/**
 * Configuration Object, implemented as injectable ConfigService
 */
@Injectable()
export class ConfigService extends AbstractConfigService {
  httpPort = switchEnv(
    {
      development: Number(process.env.APP_PORT_ANOMALY_DETECTION_BACKEND || '8080'),
    },
    Number(process.env.APP_PORT || process.env.APP_PORT_ANOMALY_DETECTION_BACKEND) || 8080,
  );

  database = switchEnv(
    {
      development: {
        host: process.env.APP_DB_HOST || 'localhost',
        port: Number(process.env.APP_DB_PORT) || 3306,
        user: process.env.APP_DB_USER || 'root',
        pass: process.env.APP_DB_PASS || '123456',
        name: process.env.APP_DB_NAME || 'chart-data-comparing',
        ssl: [1, '1', true, 'true'].includes(process.env.APP_DB_SSL || ''),
      },
      testing: {
        host: process.env.APP_TEST_DB_HOST || '',
        port: Number(process.env.APP_TEST_DB_PORT) || 3306,
        user: process.env.APP_TEST_DB_USER || '',
        pass: process.env.APP_TEST_DB_PASS || '',
        name: process.env.APP_TEST_DB_NAME || '',
        ssl: false,
      },
      e2e: {
        host: process.env.APP_TEST_DB_HOST || '',
        port: Number(process.env.APP_TEST_DB_PORT) || 3306,
        user: process.env.APP_TEST_DB_USER || '',
        pass: process.env.APP_TEST_DB_PASS || '',
        name: process.env.APP_TEST_DB_NAME || '',
        ssl: false,
      },
    },
    {
      host: process.env.APP_DB_HOST || '',
      port: Number(process.env.APP_DB_PORT) || 3306,
      user: process.env.APP_DB_USER || '',
      pass: process.env.APP_DB_PASS || '',
      name: process.env.APP_DB_NAME || '',
      ssl: [1, '1', true, 'true'].includes(process.env.APP_DB_SSL || ''),
    },
  );
}

// This line ensures the configuration object matches the defined schema
Joi.assert(new ConfigService(), CONFIG_SCHEMA, 'Invalid configuration');
