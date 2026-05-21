import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ReportActionDto, AdminUserActionDto, BanIdentityDto, MarketingNotificationDto, AdminSelfUpdateDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BanType } from '../auth/entities/banned-identity.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboardStats(); }

  // ─── Reports ──────────────────────────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'List reports (filter: pending | reviewed)' })
  getReports(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: 'pending' | 'reviewed') {
    return this.adminService.getReports(+page, +limit, status);
  }

  @Patch('reports/:id/action')
  @HttpCode(HttpStatus.OK)
  reportAction(@Param('id') id: string, @Body() dto: ReportActionDto, @CurrentUser() admin: User) {
    return this.adminService.takeReportAction(id, dto, admin.id);
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List/search users' })
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get full user detail' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban / Unban / Make Admin / Delete user' })
  userAction(@Param('id') id: string, @Body() dto: AdminUserActionDto, @CurrentUser() admin: User) {
    return this.adminService.adminUserAction(id, dto, admin);
  }

  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset / magic link to user email' })
  sendResetLink(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.sendPasswordResetLink(id, admin.id);
  }

  // ─── Banned Identities ────────────────────────────────────────────────────

  @Get('bans')
  @ApiOperation({ summary: 'List all active bans (optionally filter by type)' })
  getBans(@Query('type') type?: BanType, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getBans(type, +page, +limit);
  }

  @Post('bans')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban an IP, phone number, or email' })
  addBan(@Body() dto: BanIdentityDto, @CurrentUser() admin: User) {
    return this.adminService.addBanFromAdmin(admin.id, dto);
  }

  @Delete('bans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lift a ban' })
  removeBan(@Param('id') id: string) {
    return this.adminService.removeBan(id);
  }

  // ─── Marketing Push Notifications ─────────────────────────────────────────

  @Post('notifications/push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send targeted marketing push notification (filter by city/country/gender/role/age)' })
  sendMarketingPush(@Body() dto: MarketingNotificationDto) {
    return this.adminService.sendMarketingNotification(dto);
  }

  // ─── Admin Self Management ────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get own admin profile' })
  getAdminMe(@CurrentUser() admin: User) {
    return { id: admin.id, name: admin.name, email: admin.email, isAdmin: admin.isAdmin, isSuperAdmin: admin.isSuperAdmin };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own name/email' })
  updateAdminSelf(@CurrentUser() admin: User, @Body() dto: AdminSelfUpdateDto) {
    return this.adminService.updateSelf(admin.id, dto);
  }
}
