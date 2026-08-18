import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateDownloadDto } from './dto/create-download.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DownloadsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async create(createDownloadDto: CreateDownloadDto) {
    const download = await this.prisma.download.create({
      data: {
        name: createDownloadDto.name,
        email: createDownloadDto.email,
        company: createDownloadDto.company,
      },
    });

    // Query dynamic catalog link from homepage settings
    const settings = await this.prisma.homepageSetting.findUnique({
      where: { id: 'current' },
    });

    const catalogPath = settings?.catalogPdfUrl || '/riyasilk_catalogue.pdf';
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const catalogUrl = `${appUrl}${catalogPath}`;

    // Send catalog link to user's email asynchronously
    this.mailService
      .sendCatalogLink(download.email, download.name, catalogUrl)
      .catch(() => {});

    return {
      success: true,
      fileUrl: catalogPath,
    };
  }
}
