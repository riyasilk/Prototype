import { Module } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { MailModule } from '../mail/mail.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    MailModule,
    // Add lightweight throttler configuration (e.g. limit 3 form submits per minute per client)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
