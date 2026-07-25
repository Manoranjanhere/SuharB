import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { PRIVACY_POLICY_HTML } from './legal/privacy-policy.html';

@ApiTags('Legal')
@Controller()
export class PrivacyController {
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiProduces('text/html')
  @ApiOperation({
    summary: 'Privacy Policy (HTML) — use this URL for Play Store / App Store',
  })
  privacy(@Res() res: Response) {
    return res.status(200).send(PRIVACY_POLICY_HTML);
  }

  @Get('terms')
  @ApiOperation({ summary: 'Terms of Service URL' })
  terms(@Res() res: Response) {
    const url = process.env.TERMS_URL || 'https://sugarbf.club/terms';
    return res.redirect(url);
  }

  @Get('support')
  @ApiOperation({ summary: 'Support / Contact URL' })
  support(@Res() res: Response) {
    const url = process.env.SUPPORT_URL || 'https://sugarbf.club/support';
    return res.redirect(url);
  }
}
