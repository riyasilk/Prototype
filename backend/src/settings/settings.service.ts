import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getHomepageSettings() {
    let settings = await this.prisma.homepageSetting.findUnique({
      where: { id: 'current' },
    });

    if (!settings) {
      // Fallback/Create default settings if none exist
      settings = await this.prisma.homepageSetting.create({
        data: {
          id: 'current',
          companyName: 'Riya Silk',
          tagline:
            'Bespoke Corporate Workwear & High-Output Uniform Manufacturing',
          heroTitle:
            'Custom Uniform Manufacturing for Businesses That Demand Quality at Scale',
          heroSubtitle:
            'Riya Silk designs and manufactures custom corporate workwear, clinical apparel, and industrial uniforms. We combine premium fabrics with state-of-the-art bulk production to deliver consistent quality, on-time, every time.',
          heroCtaText: 'Request Consultation & Samples',
          heroCtaLink: '#contact-section',
          statsCapacity: '5,000+',
          statsTailors: '150+',
          statsSqFt: '100K+',
          statsClients: '500+',
          contactPhone: '+91 99999 99999',
          contactEmail: 'info@riyasilk.com',
          contactAddress: 'Riya Silk Factory, Maharashtra, India',
          catalogPdfUrl: '/riyasilk_catalogue.pdf',
          gstNumber: '27AAACR1234M1ZS',
          msmeNumber: 'UDYAM-MH-12-1234567',
          googleMapsEmbed:
            'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.8123984950346!2d72.8360668!3d19.072049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c91136b69cf1%3A0xe54e60309971936!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
        },
      });
    }

    return settings;
  }

  async updateHomepageSettings(data: any) {
    return this.prisma.homepageSetting.upsert({
      where: { id: 'current' },
      update: data,
      create: {
        id: 'current',
        ...data,
      },
    });
  }
}
