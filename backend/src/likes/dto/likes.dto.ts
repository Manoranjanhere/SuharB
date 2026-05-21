import { IsOptional, IsInt, Min, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class SuperLikeDto {
  @ApiProperty({ required: false, maxLength: 255, example: 'You seem amazing. Would love to know you.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message?: string;
}

export class ComplimentDto {
  @ApiProperty({ maxLength: 255, example: 'You have a great vibe. Let us connect.' })
  @IsString()
  @MaxLength(255)
  message: string;
}
