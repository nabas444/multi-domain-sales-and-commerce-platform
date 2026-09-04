import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { env } from '@platform/config';

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  publicId?: string;
  tags?: string[];
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'besmhzyh',
      api_key: env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    this.logger.log('Initialized Cloudinary Storage Service (Cloud: ' + (env.CLOUDINARY_CLOUD_NAME || 'besmhzyh') + ')');
  }

  /**
   * Uploads an in-memory buffer to Cloudinary using upload_stream
   */
  async uploadBuffer(
    buffer: Buffer,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const { folder = 'platform-uploads', resourceType = 'auto', publicId, tags = [] } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: publicId,
          tags,
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(`Cloudinary buffer upload failed: ${error?.message || 'Unknown error'}`);
            return reject(error || new Error('Upload failed'));
          }

          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Uploads a file from local path or remote URL to Cloudinary
   */
  async upload(
    source: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const { folder = 'platform-uploads', resourceType = 'auto', publicId, tags = [] } = options;

    try {
      const result = await cloudinary.uploader.upload(source, {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        tags,
      });

      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary upload failed: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Delete an asset from Cloudinary
   */
  async delete(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === 'ok';
    } catch (error: any) {
      this.logger.error(`Cloudinary delete failed: ${error?.message || error}`);
      return false;
    }
  }

  /**
   * Generate an optimized and transformed URL
   */
  getOptimizedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string; quality?: string | number } = {}
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'limit',
          quality: options.quality || 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }
}
