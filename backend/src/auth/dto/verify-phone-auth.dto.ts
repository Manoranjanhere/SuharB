import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneAuthDto {
  @ApiProperty({ description: 'Firebase ID token after phone OTP verification on the client' })
  @IsString()
  @MinLength(20)
  idToken: string;
}
