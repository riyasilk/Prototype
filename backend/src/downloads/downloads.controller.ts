import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { CreateDownloadDto } from './dto/create-download.dto';
import { Public } from '../decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('api/v1/downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post()
  async create(@Body() createDownloadDto: CreateDownloadDto) {
    return this.downloadsService.create(createDownloadDto);
  }
}
