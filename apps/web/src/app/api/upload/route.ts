import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'besmhzyh',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface UploadResultItem {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: 'image' | 'video' | 'raw';
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
  createdAt: string;
}

// Helper to stream a file buffer to Cloudinary
async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw'
): Promise<UploadResultItem> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        filename_override: fileName,
        use_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format || fileName.split('.').pop() || 'unknown',
          resourceType: (result.resource_type as 'image' | 'video' | 'raw') || 'raw',
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          fileName,
          createdAt: result.created_at || new Date().toISOString(),
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let folder = 'platform-media';

    // 1. Handle Multipart Form-Data (Single or Multiple Files)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      folder = (formData.get('folder') as string) || folder;
      const globalResourceType = (formData.get('resource_type') as string) || 'auto';

      // Collect all files from 'files' or 'file' keys
      const filesFromBatch = formData.getAll('files') as File[];
      const filesFromSingle = formData.getAll('file') as File[];
      const allFiles = [...filesFromBatch, ...filesFromSingle].filter(
        (f) => f && typeof f === 'object' && f.name
      );

      if (allFiles.length === 0) {
        return NextResponse.json(
          { error: { message: 'No files provided in form data' } },
          { status: 400 }
        );
      }

      // Upload each file concurrently
      const uploadPromises = allFiles.map(async (file) => {
        let detectedType: 'auto' | 'image' | 'video' | 'raw' = 'auto';
        if (globalResourceType === 'image' || globalResourceType === 'video' || globalResourceType === 'raw') {
          detectedType = globalResourceType;
        } else if (file.type.startsWith('image/')) {
          detectedType = 'image';
        } else if (file.type.startsWith('video/')) {
          detectedType = 'video';
        } else {
          detectedType = 'raw';
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return uploadBufferToCloudinary(buffer, file.name, folder, detectedType);
      });

      const settledResults = await Promise.allSettled(uploadPromises);
      const successfulUploads: UploadResultItem[] = [];
      const failedUploads: Array<{ fileName: string; error: string }> = [];

      settledResults.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          successfulUploads.push(res.value);
        } else {
          failedUploads.push({
            fileName: allFiles[index]?.name || `file-${index}`,
            error: res.reason?.message || 'Upload failed',
          });
        }
      });

      if (successfulUploads.length === 0) {
        return NextResponse.json(
          { error: { message: 'All file uploads failed', details: failedUploads } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: successfulUploads[0], // backward compatibility
        files: successfulUploads,
        total: successfulUploads.length,
        failures: failedUploads.length > 0 ? failedUploads : undefined,
      });
    }

    // 2. Handle Application/JSON (Single or Multiple Base64 / Remote URLs)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      folder = body.folder || folder;
      const globalResourceType = body.resource_type || 'auto';

      // Support either body.files (array) or body.file (single string)
      const inputItems: Array<{ file: string; name?: string; resourceType?: any }> = [];
      if (Array.isArray(body.files)) {
        body.files.forEach((item: any) => {
          if (typeof item === 'string') inputItems.push({ file: item });
          else if (item?.file) inputItems.push(item);
        });
      } else if (body.file) {
        inputItems.push({ file: body.file, name: body.name, resourceType: body.resource_type });
      }

      if (inputItems.length === 0) {
        return NextResponse.json(
          { error: { message: 'No file or base64 data provided in body' } },
          { status: 400 }
        );
      }

      const uploadPromises = inputItems.map(async (item, index) => {
        const itemResType = item.resourceType || globalResourceType;
        const result = await cloudinary.uploader.upload(item.file, {
          folder,
          resource_type: itemResType === 'auto' ? 'auto' : itemResType,
        });

        return {
          url: result.secure_url || result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format || 'unknown',
          resourceType: (result.resource_type as 'image' | 'video' | 'raw') || 'image',
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          fileName: item.name || result.original_filename || `asset-${index + 1}`,
          createdAt: result.created_at || new Date().toISOString(),
        } as UploadResultItem;
      });

      const settled = await Promise.allSettled(uploadPromises);
      const successful: UploadResultItem[] = [];
      const failed: any[] = [];

      settled.forEach((res, i) => {
        if (res.status === 'fulfilled') successful.push(res.value);
        else failed.push({ index: i, error: res.reason?.message || 'Upload failed' });
      });

      if (successful.length === 0) {
        return NextResponse.json(
          { error: { message: 'Base64 uploads failed', details: failed } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: successful[0],
        files: successful,
        total: successful.length,
        failures: failed.length > 0 ? failed : undefined,
      });
    }

    return NextResponse.json(
      { error: { message: 'Unsupported Content-Type. Use multipart/form-data or application/json' } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal Cloudinary upload error' } },
      { status: 500 }
    );
  }
}
