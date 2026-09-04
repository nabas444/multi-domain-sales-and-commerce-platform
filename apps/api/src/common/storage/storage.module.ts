import { Global, Module } from '@nestjs/common';
import { S3StorageService } from './s3-storage.service.js';
import { CloudinaryStorageService } from './cloudinary-storage.service.js';

@Global()
@Module({
  providers: [S3StorageService, CloudinaryStorageService],
  exports: [S3StorageService, CloudinaryStorageService],
})
export class StorageModule {}
