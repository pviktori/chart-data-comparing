import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';
import { MIGRATION_PATH, MIGRATION_TABLE_NAME, TABLE_PREFIX } from './definitions';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { getTypeOrmQueryDebuggingSetting } from './core/typeorm-query-debug';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { DataSource } from 'typeorm';
import { SessionModule } from './session/session.module';
import { DataJobModule } from './data-job/data-job.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [],
})
export class AppModule {
  static forApp(): DynamicModule {
    return this.buildDynamicModule({
      migrationsRun: true,
    });
  }

  static forE2E(dbName: string): DynamicModule {
    return this.buildDynamicModule({
      dbName,
      migrationsRun: false,
    });
  }

  private static buildDynamicModule({
    dbName,
    migrationsRun,
  }: {
    dbName?: string;
    migrationsRun?: boolean;
  }): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
          useFactory: (config: ConfigService) => ({
            type: 'mysql',
            host: config.database.host,
            ssl: config.database.ssl
              ? {
                  rejectUnauthorized: true,
                }
              : false,
            port: config.database.port,
            username: config.database.user,
            password: config.database.pass,
            database: dbName ? dbName : config.database.name,
            autoLoadEntities: true,
            migrationsTableName: TABLE_PREFIX + MIGRATION_TABLE_NAME,
            migrations: [MIGRATION_PATH],
            namingStrategy: new SnakeNamingStrategy(),
            migrationsRun,
            ...getTypeOrmQueryDebuggingSetting(),
          }),
          inject: [ConfigService],
          dataSourceFactory: async options => {
            return new DataSource(options).initialize();
          },
        }),
        DataSourcesModule,
        SessionModule,
        DataJobModule,
        SettingsModule,
      ],
      providers: [],
      controllers: [],
      exports: [],
    };
  }
}
