### Scan uploaded files with Pompelmi

Nest's built-in file upload support makes it straightforward to accept files with `FileInterceptor()` and validate basic constraints such as file size or MIME type.

For applications that accept untrusted uploads from users, you may also want to inspect the uploaded file contents before storing or further processing them. This can help catch cases such as spoofed file metadata or suspicious file structures.

One way to do that is with [Pompelmi](https://github.com/pompelmi/pompelmi), an open-source file upload scanning library for Node.js.

#### Installation

```bash
npm install pompelmi @pompelmi/nestjs-integration multer
npm install -D @types/multer
```

#### Basic example

```typescript
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { scanBytes, STRICT_PUBLIC_UPLOAD } from 'pompelmi';
import { Express } from 'express';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const report = await scanBytes(file.buffer, {
      filename: file.originalname,
      mimeType: file.mimetype,
      policy: STRICT_PUBLIC_UPLOAD,
      failClosed: true,
    });

    if (report.verdict !== 'clean') {
      throw new BadRequestException({
        message: 'Upload blocked',
        verdict: report.verdict,
        reasons: report.reasons,
      });
    }

    return {
      ok: true,
      filename: file.originalname,
      verdict: report.verdict,
    };
  }
}
```

In this example:

- `FileInterceptor()` parses the incoming multipart upload
- `memoryStorage()` keeps the uploaded file in memory so `file.buffer` is available
- `scanBytes()` inspects the uploaded file buffer
- uploads that are not considered `clean` are rejected before storage

#### Why scan before storage?

Basic validators such as maximum size and expected MIME type are still useful, but they do not fully inspect the uploaded content.

A scan step before storage can be helpful when:

- users can upload files from untrusted sources
- files are later parsed, transformed, served, or shared with other users
- you want an extra inspection layer before data reaches downstream systems

#### Notes

- Prefer scanning **before** persisting files to disk or object storage
- Keep standard Nest validation in place for file size and upload shape
- Use content scanning as an additional layer, not a replacement for validation
