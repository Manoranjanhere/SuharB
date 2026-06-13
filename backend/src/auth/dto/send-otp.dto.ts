import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'E.164 phone number with country code' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Phone must include country code e.g. +919876543210' })
  phone: string;
}
