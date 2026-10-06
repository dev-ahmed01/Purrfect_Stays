import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { RequestContextModule } from './common/context/request-context.module.js';
import { AllExceptionsFilter } from './common/http/all-exceptions.filter.js';
import { RequestIdMiddleware } from './common/http/request-id.middleware.js';
import { ResponseEnvelopeInterceptor } from './common/http/response-envelope.interceptor.js';
import { RequestLoggingInterceptor } from './common/logging/request-logging.interceptor.js';
import { validateEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { FavouritesModule } from './favourites/favourites.module.js';
import { HealthModule } from './health/health.module.js';
import { PetsModule } from './pets/pets.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    RequestContextModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    BookingsModule,
    PetsModule,
    FavouritesModule,
    ReviewsModule,
    PropertiesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
