import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@kari/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { IdentityService, type UploadedFile as MultipartFile } from './identity.service';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('identity')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('documents/:type')
  @ApiOperation({ summary: 'Upload a KYC/onboarding document (multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  @ResponseMessage('Document uploaded')
  upload(
    @CurrentUser('id') userId: string,
    @Param('type', new ParseEnumPipe(DocumentType)) type: DocumentType,
    @UploadedFile() file: MultipartFile,
  ) {
    return this.identity.uploadDocument(userId, type, file);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List my uploaded documents' })
  @ResponseMessage('Documents')
  list(@CurrentUser('id') userId: string) {
    return this.identity.listDocuments(userId);
  }
}
