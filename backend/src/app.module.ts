import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GalleryModule } from './gallery/gallery.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { FaqModule } from './faq/faq.module';
import { SettingsModule } from './settings/settings.module';
import { DownloadsModule } from './downloads/downloads.module';
import { UploadModule } from './upload/upload.module';
import { QuotationsModule } from './quotations/quotations.module';
import { OrdersModule } from './orders/orders.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MailModule,
    InquiriesModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    GalleryModule,
    TestimonialModule,
    FaqModule,
    SettingsModule,
    DownloadsModule,
    UploadModule,
    QuotationsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
