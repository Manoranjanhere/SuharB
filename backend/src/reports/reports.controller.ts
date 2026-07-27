import {
  Controller, Post, Param, Body, UseGuards, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { getClientIp } from '../audits/audit.utils';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a user or their photo' })
  report(
    @CurrentUser() user: User,
    @Param('userId') reportedUserId: string,
    @Body() dto: CreateReportDto,
    @Req() req: Request,
  ) {
    return this.reportsService.createReport(
      user.id,
      reportedUserId,
      dto,
      getClientIp(req),
    );
  }
}
