import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@platform/config';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileUrl: string;
  bucket: string;
  expiresInSeconds: number;
}

@Injectable()
export class S3StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly baseUrl: string;

  constructor() {
    this.bucketName = env.S3_BUCKET_NAME || 'platform-media';
    const protocol = env.S3_USE_SSL ? 'https' : 'http';
    const endpoint = `${protocol}://${env.S3_ENDPOINT}:${env.S3_PORT}`;
    this.baseUrl = `${endpoint}/${this.bucketName}`;

    this.s3Client = new S3Client({
      region: env.S3_REGION || 'us-east-1',
      endpoint,
      forcePathStyle: true, // Required for MinIO and self-hosted S3-compatible endpoints
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });

    this.logger.log(`Initialized S3 Storage client targeting ${endpoint} bucket [${this.bucketName}]`);
  }

  /**
   * Generates a pre-signed URL for direct client upload to S3/MinIO
   */
  async generatePresignedUploadUrl(params: {
    organizationId: string;
    fileName: string;
    mimeType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedUploadResult> {
    const { organizationId, fileName, mimeType, expiresInSeconds = 3600 } = params;

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${organizationId}/${Date.now()}-${uuidv4()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    const fileUrl = `${this.baseUrl}/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      fileUrl,
      bucket: this.bucketName,
      expiresInSeconds,
    };
  }

  /**
   * Generates a pre-signed URL for temporary authorized download of private media
   */
  async generatePresignedDownloadUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  getPublicUrl(fileKey: string): string {
    return `${this.baseUrl}/${fileKey}`;
  }
}
