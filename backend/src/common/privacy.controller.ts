import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Legal')
@Controller()
export class PrivacyController {
  @Get('privacy')
  @Redirect()
  @ApiOperation({ summary: 'Privacy Policy URL (required for App Store / Play Store)' })
  privacy() {
    return { url: process.env.PRIVACY_URL || 'https://sugarbf.club/privacy' };
  }

  @Get('terms')
  @Redirect()
  @ApiOperation({ summary: 'Terms of Service URL' })
  terms() {
    return { url: process.env.TERMS_URL || 'https://sugarbf.club/terms' };
  }

  @Get('support')
  @Redirect()
  @ApiOperation({ summary: 'Support / Contact URL' })
  support() {
    return { url: process.env.SUPPORT_URL || 'https://sugarbf.club/support' };
  }
}
