import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../decorators/public.decorator';

@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('homepage')
  async getHomepage() {
    return this.settingsService.getHomepageSettings();
  }

  @Put('homepage')
  async updateHomepage(@Body() body: any) {
    return this.settingsService.updateHomepageSettings(body);
  }
}
