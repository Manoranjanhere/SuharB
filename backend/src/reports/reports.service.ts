import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { CreateReportDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReport(
    reporterId: string,
    reportedUserId: string,
    dto: CreateReportDto,
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
    return { message: 'Report submitted. Our team will review it shortly.' };
  }
}
