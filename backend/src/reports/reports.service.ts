import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { CreateReportDto } from './dto/report.dto';
import { AuditService } from '../audits/audits.service';
import { ReportActivityName } from '../audits/audit.constants';
import { buildAdminProfileLink } from '../audits/audit.utils';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async createReport(
    reporterId: string,
    reportedUserId: string,
    dto: CreateReportDto,
    clientIp?: string | null,
  ): Promise<{ message: string }> {
    if (reporterId === reportedUserId) {
      throw new ConflictException('Cannot report yourself');
    }

    const target = await this.userRepository.findOne({ where: { id: reportedUserId } });
    if (!target) throw new NotFoundException('User not found');

    const report = this.reportRepository.create({
      reporterId,
      reportedUserId,
      reason: dto.reason,
      description: dto.description,
      reportedPhotoId: dto.reportedPhotoId,
    });

    await this.reportRepository.save(report);

    const isPhotoReport = Boolean(dto.reportedPhotoId);
    await this.auditService.logReport({
      forUser: reportedUserId,
      byUser: reporterId,
      activityName: isPhotoReport
        ? ReportActivityName.REPORT_PHOTO
        : ReportActivityName.REPORT_USER,
      affectedDataName: isPhotoReport ? 'Photo' : 'Profile',
      fromValue: null,
      toValue: dto.reason,
      notes: [
        clientIp ? `IP: ${clientIp}` : null,
        dto.description ? `Desc: ${dto.description}` : null,
        `ReportId: ${report.id}`,
      ]
        .filter(Boolean)
        .join(' | ') || null,
      reportId: report.id,
      reportedPhotoId: dto.reportedPhotoId || null,
      adminLink: buildAdminProfileLink(reportedUserId),
    });

    return { message: 'Report submitted. Our team will review it shortly.' };
  }
}
