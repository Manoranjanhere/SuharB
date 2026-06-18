import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadPhotoBase64Dto {
  @ApiProperty({ description: 'Base64-encoded image bytes (no data: prefix)' })
  @IsString()
  @MinLength(32)
  image: string;

  @ApiProperty({ minimum: 0, maximum: 5 })
  @IsInt()
  @Min(0)
  @Max(5)
  order: number;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 'photo_0.jpg' })
  @IsOptional()
  @IsString()
  fileName?: string;
}
