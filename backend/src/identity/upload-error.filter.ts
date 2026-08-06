import { ArgumentsHost, Catch, PayloadTooLargeException } from '@nestjs/common';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

/**
 * Maps multer's `LIMIT_FILE_SIZE` error (raised when an upload exceeds the
 * configured `limits.fileSize`, before the file is fully buffered) to a clean
 * 413 Payload Too Large.
 *
 * Extends the platform's `AllExceptionsFilter` so the 413 mapping AND every other
 * error on the upload route (400, 415, 5xx) are rendered with the same uniform
 * `ApiResponse` envelope (`success`/`data`/`error`/`traceId`) every other endpoint
 * returns. Only the multer-size translation is new; the rest falls through to the
 * app's normal formatting.
 *
 * Duck-types on `.code` so we need no `@types/multer` dependency.
 */
@Catch()
export class UploadErrorFilter extends AllExceptionsFilter {
  catch(err: unknown, host: ArgumentsHost): void {
    if ((err as { code?: string })?.code === 'LIMIT_FILE_SIZE') {
      super.catch(new PayloadTooLargeException('File exceeds the maximum allowed size'), host);
      return;
    }
    super.catch(err, host);
  }
}
