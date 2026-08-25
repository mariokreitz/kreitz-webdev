import { ArcjetRateLimitGuard } from '@app/common/guards/arcjet-rate-limit.guard';
import {
  CV_FILE_FIELD_NAME,
  CV_MIME_TYPE,
  CV_MULTER_HARD_LIMIT_BYTES,
} from '@app/modules/cv-document/constants/cv-document.constants';
import { CvDocumentService } from '@app/modules/cv-document/cv-document.service';
import { CvStatusDto } from '@app/modules/cv-document/dto/cv-status.dto';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { memoryStorage } from 'multer';

type MulterFileFilter = NonNullable<NonNullable<Parameters<typeof FileInterceptor>[1]>['fileFilter']>;

// WHY: typed against @nestjs/platform-express's own (unexported) fileFilter option type, not multer's FileFilterCallback directly — the two packages declare structurally incompatible callback arities.
const pdfOnlyFileFilter: MulterFileFilter = (_request, file, callback) => {
  if (file.mimetype !== CV_MIME_TYPE) {
    callback(new BadRequestException('Only PDF files are allowed'), false);
    return;
  }

  callback(null, true);
};

@ApiTags('CV Document')
@ApiCookieAuth('session-cookie')
@ApiResponse({ status: 401, description: 'No valid session' })
@UseGuards(ArcjetRateLimitGuard)
@Controller('cv-document')
export class CvDocumentController {
  constructor(private readonly cvDocumentService: CvDocumentService) {}

  @Get('status')
  @ApiOperation({
    summary: "Get the current user's CV upload metadata, without the file bytes",
  })
  @ApiResponse({ status: 200, type: CvStatusDto, description: 'CV metadata, or null when none is uploaded' })
  public async getStatus(@Session() session: UserSession): Promise<CvStatusDto | null> {
    const meta = await this.cvDocumentService.getStatus(session.user.id);

    return meta ? CvStatusDto.fromRecord(meta) : null;
  }

  @Post()
  @UseInterceptors(
    FileInterceptor(CV_FILE_FIELD_NAME, {
      storage: memoryStorage(),
      limits: { fileSize: CV_MULTER_HARD_LIMIT_BYTES, files: 1 },
      fileFilter: pdfOnlyFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { [CV_FILE_FIELD_NAME]: { type: 'string', format: 'binary' } } },
  })
  @ApiOperation({
    summary: "Upload (or replace) the current user's CV as a PDF",
  })
  @ApiResponse({ status: 201, type: CvStatusDto, description: 'The stored CV metadata' })
  @ApiResponse({ status: 400, description: 'Missing file, file too large, or file is not a valid PDF' })
  public async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Session() session: UserSession,
  ): Promise<CvStatusDto> {
    const record = await this.cvDocumentService.upload(session.user.id, file);

    return CvStatusDto.fromRecord(record);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove the current user's CV",
  })
  @ApiResponse({ status: 200, description: 'CV removed' })
  @ApiResponse({ status: 404, description: 'No CV is currently uploaded' })
  public async remove(@Session() session: UserSession): Promise<void> {
    return this.cvDocumentService.remove(session.user.id);
  }
}
