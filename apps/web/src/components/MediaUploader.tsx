'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge } from '@platform/ui';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  CheckCircle2,
  X,
  Copy,
  Check,
  Film,
  FileText,
  Trash2,
  Star,
  ExternalLink,
  Eye,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';

export interface UploadedMedia {
  id?: string;
  url: string;
  secureUrl: string;
  publicId?: string;
  format?: string;
  resourceType: 'image' | 'video' | 'raw';
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
  title?: string;
  tag?: 'hero' | 'gallery' | 'floorplan' | 'title_deed' | 'inspection' | 'footage';
}

interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
  result?: UploadedMedia;
}

interface MediaUploaderProps {
  value?: UploadedMedia[];
  onChange?: (mediaList: UploadedMedia[]) => void;
  onUploadSuccess?: (media: UploadedMedia) => void;
  onBatchUploadSuccess?: (mediaList: UploadedMedia[]) => void;
  folder?: string;
  acceptedTypes?: 'all' | 'image' | 'video';
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
  allowTagging?: boolean;
  maxFiles?: number;
}

export function MediaUploader({
  value,
  onChange,
  onUploadSuccess,
  onBatchUploadSuccess,
  folder = 'platform-media',
  acceptedTypes = 'all',
  maxSizeMB = 100,
  multiple = true,
  className = '',
  allowTagging = true,
  maxFiles = 20,
}: MediaUploaderProps) {
  const [internalList, setInternalList] = useState<UploadedMedia[]>(value || []);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [previewMedia, setPreviewMedia] = useState<UploadedMedia | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when controlled value updates
  useEffect(() => {
    if (value) {
      setInternalList(value);
    }
  }, [value]);

  const currentList = value !== undefined ? value : internalList;

  const updateList = (newList: UploadedMedia[]) => {
    setInternalList(newList);
    if (onChange) {
      onChange(newList);
    }
  };

  const acceptString =
    acceptedTypes === 'image'
      ? 'image/*'
      : acceptedTypes === 'video'
      ? 'video/*'
      : 'image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Check limit
    if (currentList.length + fileArray.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files in this batch.`);
      return;
    }

    // Prepare queue items
    const newQueueItems: UploadQueueItem[] = fileArray.map((f) => ({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      progress: 10,
      status: 'uploading',
    }));

    setQueue((prev) => [...prev, ...newQueueItems]);

    // Upload files concurrently
    const uploadedBatch: UploadedMedia[] = [];

    await Promise.all(
      newQueueItems.map(async (queueItem) => {
        try {
          const file = queueItem.file;
          if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`Exceeds limit of ${maxSizeMB}MB`);
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', folder);

          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');
          formData.append('resource_type', isVideo ? 'video' : isImage ? 'image' : 'raw');

          // Progress simulation
          setQueue((q) =>
            q.map((item) =>
              item.id === queueItem.id ? { ...item, progress: 45 } : item
            )
          );

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error?.message || 'Upload failed');
          }

          const rawData: UploadedMedia = json.data;
          const uploadedItem: UploadedMedia = {
            ...rawData,
            id: rawData.publicId || `med-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            fileName: file.name,
            title: file.name.replace(/\.[^/.]+$/, ''),
            tag: isVideo
              ? 'footage'
              : file.type.includes('pdf') || file.name.toLowerCase().includes('deed')
              ? 'title_deed'
              : currentList.length === 0 && uploadedBatch.length === 0
              ? 'hero'
              : 'gallery',
          };

          uploadedBatch.push(uploadedItem);

          setQueue((q) =>
            q.map((item) =>
              item.id === queueItem.id
                ? { ...item, status: 'completed', progress: 100, result: uploadedItem }
                : item
            )
          );

          if (onUploadSuccess) {
            onUploadSuccess(uploadedItem);
          }
        } catch (err: any) {
          setQueue((q) =>
            q.map((item) =>
              item.id === queueItem.id
                ? { ...item, status: 'failed', error: err.message || 'Upload failed' }
                : item
            )
          );
        }
      })
    );

    if (uploadedBatch.length > 0) {
      const updated = [...currentList, ...uploadedBatch];
      updateList(updated);
      if (onBatchUploadSuccess) {
        onBatchUploadSuccess(uploadedBatch);
      }
    }

    // Auto-clear completed items from queue after 3 seconds
    setTimeout(() => {
      setQueue((q) => q.filter((item) => item.status !== 'completed'));
    }, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updated = currentList.filter((_, i) => i !== index);
    updateList(updated);
  };

  const handleSetPrimary = (index: number) => {
    const item = currentList[index];
    const rest = currentList.filter((_, i) => i !== index);
    const updated = [{ ...item, tag: 'hero' as const }, ...rest];
    updateList(updated);
  };

  const handleTagChange = (index: number, newTag: UploadedMedia['tag']) => {
    const updated = currentList.map((m, i) => (i === index ? { ...m, tag: newTag } : m));
    updateList(updated);
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isUploadingAny = queue.some((q) => q.status === 'uploading');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptString}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = ''; // allow re-uploading same file
          }
        }}
      />

      {/* Drag & Drop Multi-Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isUploadingAny
            ? 'border-indigo-400 bg-indigo-50/50'
            : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/70 hover:bg-zinc-100/80 shadow-xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="h-11 w-11 rounded-full bg-white border border-zinc-200 shadow-xs flex items-center justify-center text-zinc-600">
            {isUploadingAny ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            ) : (
              <UploadCloud className="h-5 w-5 text-zinc-600" />
            )}
          </div>
          <div>
            <div className="font-semibold text-sm text-zinc-900 flex items-center justify-center gap-1.5">
              <span>Click to browse</span>
              <span className="text-zinc-400 font-normal">or</span>
              <span>drag &amp; drop multiple files</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Select multiple High-Res Photos (JPG/PNG), Video Tours (MP4/WebM), &amp; Title Deeds (PDF)
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="h-3 w-3" />
              Batch Upload Enabled
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              <span>Cloudinary CDN Accelerated</span>
            </span>
            <span className="text-[11px] text-zinc-400">Up to {maxSizeMB}MB/file</span>
          </div>
        </div>
      </div>

      {/* Active Upload Queue Progress Cards */}
      {queue.length > 0 && (
        <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
            <span>Uploading Batch ({queue.length} files in progress)...</span>
            {isUploadingAny && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                <Loader2 className="h-3 w-3 animate-spin" />
                Streaming to Cloudinary CDN
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-zinc-200 rounded-md p-2.5 text-xs flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-800 truncate">
                    {item.file.type.startsWith('video/') ? (
                      <Film className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    ) : item.file.type.startsWith('image/') ? (
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span>{formatBytes(item.size)}</span>
                    <span>•</span>
                    <span
                      className={
                        item.status === 'completed'
                          ? 'text-emerald-600 font-medium'
                          : item.status === 'failed'
                          ? 'text-rose-600 font-medium'
                          : 'text-indigo-600'
                      }
                    >
                      {item.status === 'completed'
                        ? 'Ready'
                        : item.status === 'failed'
                        ? item.error || 'Failed'
                        : 'Transcoding...'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : item.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5 text-rose-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Materials Gallery & Edit Deck */}
      {currentList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Attached Media &amp; Proof Materials ({currentList.length})
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono">
                {currentList.filter((m) => m.resourceType === 'image').length} Photos •{' '}
                {currentList.filter((m) => m.resourceType === 'video').length} Footages •{' '}
                {currentList.filter((m) => m.resourceType === 'raw').length} Documents
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add More Files
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentList.map((mediaItem, idx) => {
              const isVideo =
                mediaItem.resourceType === 'video' ||
                mediaItem.secureUrl?.endsWith('.mp4') ||
                mediaItem.secureUrl?.includes('/video/');
              const isDoc =
                mediaItem.resourceType === 'raw' ||
                mediaItem.secureUrl?.endsWith('.pdf') ||
                mediaItem.format === 'pdf';

              return (
                <div
                  key={mediaItem.id || mediaItem.publicId || idx}
                  className="group relative border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Thumbnail & Preview Area */}
                  <div className="relative aspect-4/3 bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {isVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                        <video
                          src={mediaItem.secureUrl}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                            <Film className="h-4 w-4" />
                          </div>
                        </div>
                        <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white px-1.5 py-0.5 rounded">
                          VIDEO TOUR
                        </span>
                      </div>
                    ) : isDoc ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-1.5">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-700 truncate max-w-[120px]">
                          {mediaItem.fileName || 'Proof Document'}
                        </span>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono">
                          {mediaItem.format || 'PDF'}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={mediaItem.secureUrl}
                        alt={mediaItem.title || 'Media thumbnail'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    {/* Tag Badge */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {idx === 0 ? (
                        <span className="bg-amber-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          Hero Cover
                        </span>
                      ) : (
                        <span className="bg-zinc-900/75 backdrop-blur-xs text-white font-medium text-[9px] uppercase px-1.5 py-0.5 rounded shadow-xs">
                          {mediaItem.tag?.replace('_', ' ') || (isVideo ? 'Footage' : 'Photo')}
                        </span>
                      )}
                    </div>

                    {/* Quick Hover Controls */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(mediaItem)}
                        className="p-1 rounded-md bg-white/90 hover:bg-white text-zinc-700 shadow-xs transition-colors"
                        title="Inspect full view"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="p-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-colors"
                        title="Delete this material"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata and Editing Footer */}
                  <div className="p-2.5 space-y-1.5 border-t border-zinc-100 bg-white">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-800 truncate max-w-[120px]" title={mediaItem.title || mediaItem.fileName}>
                        {mediaItem.title || mediaItem.fileName || `Asset #${idx + 1}`}
                      </span>
                      <span className="text-zinc-400 font-mono text-[10px]">
                        {formatBytes(mediaItem.bytes)}
                      </span>
                    </div>

                    {/* Tag Selector & Actions */}
                    {allowTagging && (
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <select
                          value={mediaItem.tag || (isVideo ? 'footage' : 'gallery')}
                          onChange={(e) => handleTagChange(idx, e.target.value as any)}
                          className="text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                        >
                          <option value="hero">Hero Cover</option>
                          <option value="gallery">Gallery Photo</option>
                          <option value="footage">Video Footage</option>
                          <option value="floorplan">Floor Plan</option>
                          <option value="title_deed">Title Deed</option>
                          <option value="inspection">Inspection Report</option>
                        </select>

                        <div className="flex items-center gap-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="text-[10px] text-amber-600 hover:text-amber-700 font-medium px-1 rounded hover:bg-amber-50"
                              title="Make primary hero cover"
                            >
                              Make Hero
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(mediaItem.id || String(idx), mediaItem.secureUrl)}
                            className="text-zinc-400 hover:text-zinc-600 p-0.5"
                            title="Copy Cloudinary CDN URL"
                          >
                            {copiedId === (mediaItem.id || String(idx)) ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Material Inspection Lightbox Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="fixed inset-0"
            onClick={() => setPreviewMedia(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 text-white">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-zinc-300 border-zinc-700 text-xs">
                  {previewMedia.resourceType.toUpperCase()}
                </Badge>
                <span className="font-semibold text-sm truncate max-w-md">
                  {previewMedia.fileName || previewMedia.title || 'Material Inspection Preview'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.secureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Raw CDN
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-center max-h-[75vh] bg-black/50">
              {previewMedia.resourceType === 'video' ||
              previewMedia.secureUrl?.endsWith('.mp4') ||
              previewMedia.secureUrl?.includes('/video/') ? (
                <video
                  src={previewMedia.secureUrl}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-auto max-w-full rounded"
                />
              ) : previewMedia.resourceType === 'raw' || previewMedia.secureUrl?.endsWith('.pdf') ? (
                <div className="p-12 text-center text-zinc-300 space-y-3">
                  <FileText className="h-16 w-16 mx-auto text-red-400" />
                  <div>
                    <h5 className="font-bold text-lg">{previewMedia.fileName || 'Title Deed & Ownership Document'}</h5>
                    <p className="text-xs text-zinc-400 mt-1 font-mono">{previewMedia.secureUrl}</p>
                  </div>
                  <a
                    href={previewMedia.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View &amp; Verify Document on Cadastre
                  </a>
                </div>
              ) : (
                <img
                  src={previewMedia.secureUrl}
                  alt="Material Preview"
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded"
                />
              )}
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span className="font-mono text-[11px] truncate max-w-lg">
                CDN URL: {previewMedia.secureUrl}
              </span>
              <span className="font-mono text-[11px]">
                {formatBytes(previewMedia.bytes)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
