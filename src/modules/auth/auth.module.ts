
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { CommonModule } from '../../common/common.module';

import { OrganizationModule } from '../organization/organization.module';
import { UsersModule } from '../users/users.module';
import { RbacModule } from './rbac.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccessGuard } from './guards/access.guard';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as any,
        },
      }),
    }),
    OrganizationModule,
    UsersModule,
    RbacModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AccessGuard,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: AccessGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
