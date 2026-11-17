
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { OrganizationModule } from './modules/organization/organization.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? '.env.test'
          : '.env',
      load: [
        databaseConfig,
        jwtConfig,
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ): TypeOrmModuleOptions =>
        configService.getOrThrow<TypeOrmModuleOptions>(
          'database',
        ),
    }),

    OrganizationModule,
    BranchesModule,
    AuthModule,
  ],
})
export class AppModule {}
