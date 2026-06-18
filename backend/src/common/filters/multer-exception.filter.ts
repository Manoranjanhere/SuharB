import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MulterExceptionFilter.name);

  catch(exception: MulterError, host: ArgumentsHost) {
    this.logger.warn(`Multer ${exception.code}: ${exception.message}`);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be under 10MB'
        : exception.message || 'Upload failed';

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
    });
  }
}
