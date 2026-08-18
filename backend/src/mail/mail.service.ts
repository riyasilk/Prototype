import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // True for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Nodemailer SMTP Transporter configured successfully.');
    } else {
      this.logger.warn(
        'SMTP configurations missing in environment. Emails will be logged to console instead.',
      );
    }
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<boolean> {
    const from =
      this.configService.get<string>('SMTP_USER') || 'no-reply@riyasilk.com';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(
          `Email successfully sent to ${to} (Subject: ${subject})`,
        );
        return true;
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        return false;
      }
    } else {
      this.logger.log(
        `[LOCAL DEV MAIL] TO: ${to} | SUBJECT: ${subject} | CONTENT: ${text}`,
      );
      return true;
    }
  }

  async sendInquiryNotification(inquiryData: {
    contactName: string;
    company: string;
    email: string;
    phone: string;
    industry?: string;
    quantity?: string;
    message?: string;
  }) {
    const salesEmail = 'sales@riyasilk.com';

    // 1. Send notification alert to Sales Team
    const salesSubject = `New B2B Lead Inquiry - ${inquiryData.company}`;
    const salesText = `
      You have received a new B2B lead inquiry from the website.
      
      Client Details:
      - Company: ${inquiryData.company}
      - Contact Name: ${inquiryData.contactName}
      - Email: ${inquiryData.email}
      - Phone: ${inquiryData.phone}
      - Industry: ${inquiryData.industry || 'Not specified'}
      - Est. Quantity: ${inquiryData.quantity || 'Not specified'}
      
      Inquiry Message:
      ${inquiryData.message || 'No additional details provided.'}
    `;
    await this.sendMail(salesEmail, salesSubject, salesText);

    // 2. Send automated confirmation receipt to the Customer
    const customerSubject = `Thank you for contacting Riya Silk`;
    const customerText = `
      Dear ${inquiryData.contactName},
      
      Thank you for reaching out to Riya Silk. We have successfully received your uniform procurement inquiry.
      
      Our team is currently reviewing your project requirements and fabric specifications. A dedicated procurement manager will contact you within 24 business hours to discuss custom solutions and arrange for fabric sample delivery.
      
      Warm regards,
      The Procurement Team
      Riya Silk Manufacturer
    `;
    await this.sendMail(inquiryData.email, customerSubject, customerText);
  }

  async sendCatalogLink(email: string, name: string, catalogUrl: string) {
    const subject = `Your Riya Silk Product Catalog Download`;
    const text = `
Dear ${name},

Thank you for downloading the Riya Silk Product Catalog!

You can access and review our comprehensive corporate wear, hospitality apparel, and industrial safety catalog anytime using the link below:
${catalogUrl}

Our team is available Monday to Saturday to answer sizing, design customization, or volume shipping questions.

Warm regards,
The Procurement Team
Riya Silk Manufacturer
    `;
    await this.sendMail(email, subject, text);
  }
}
