import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PRIVACY_POLICY_HTML } from './legal/privacy-policy.html';
import { NRI_MATRIMONY_PRIVACY_HTML } from './legal/nri-matrimony-privacy.html';
import { NRI_FRIENDS_PRIVACY_HTML } from './legal/nri-friends-privacy.html';

function privacyHtmlForHost(host: string | undefined): string {
  const h = (host || '').toLowerCase();
  if (h.startsWith('nri-api.')) return NRI_MATRIMONY_PRIVACY_HTML;
  if (h.startsWith('nrifriends.') || h.startsWith('nrifriends-api.')) {
    return NRI_FRIENDS_PRIVACY_HTML;
  }
  return PRIVACY_POLICY_HTML;
}

@ApiTags('Legal')
@Controller()
export class PrivacyController {
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiProduces('text/html')
  @ApiOperation({
    summary:
      'Privacy Policy (HTML) — SugarBF, or NRI Matrimony / NRI Friends depending on the domain',
  })
  privacy(@Req() req: Request, @Res() res: Response) {
    return res.status(200).send(privacyHtmlForHost(req.hostname));
  }

  @Get('privacy/nri-matrimony')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiProduces('text/html')
  @ApiOperation({ summary: 'NRI Matrimony Privacy Policy (HTML)' })
  nriMatrimonyPrivacy(@Res() res: Response) {
    return res.status(200).send(NRI_MATRIMONY_PRIVACY_HTML);
  }

  @Get('privacy/nri-friends')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiProduces('text/html')
  @ApiOperation({ summary: 'NRI Friends Privacy Policy (HTML)' })
  nriFriendsPrivacy(@Res() res: Response) {
    return res.status(200).send(NRI_FRIENDS_PRIVACY_HTML);
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
