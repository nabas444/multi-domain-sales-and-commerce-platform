'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Tabs,
  Modal,
} from '@platform/ui';
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Copy,
  Check,
  Film,
  ExternalLink,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MediaUploader, UploadedMedia } from '@/components/MediaUploader';

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<UploadedMedia | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial media assets (including sample uploaded Cloudinary media)
  const [assets, setAssets] = useState<UploadedMedia[]>([
    {
      publicId: 'platform-test/g2zd9zkuix5rqbnqz2bt',
      url: 'https://res.cloudinary.com/besmhzyh/image/upload/v1788543419/platform-test/g2zd9zkuix5rqbnqz2bt.png',
      secureUrl: 'https://res.cloudinary.com/besmhzyh/image/upload/v1788543419/platform-test/g2zd9zkuix5rqbnqz2bt.png',
      format: 'png',
      resourceType: 'image',
      bytes: 70,
      width: 1,
      height: 1,
    },
    {
      publicId: 'platform-media/sample-penthouse-interior',
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      secureUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      format: 'jpeg',
      resourceType: 'image',
      bytes: 284000,
      width: 1200,
      height: 800,
    },
    {
      publicId: 'platform-media/sample-villa-facade',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      secureUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      format: 'jpeg',
      resourceType: 'image',
      bytes: 412000,
      width: 1200,
      height: 800,
    },
  ]);

  const handleUploadSuccess = (media: UploadedMedia) => {
    setAssets((prev) => [media, ...prev]);
    setUploadModalOpen(false);
  };

  const handleCopy = (id?: string, url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === 'images') return asset.resourceType === 'image';
    if (activeTab === 'videos') return asset.resourceType === 'video';
    return true;
  });

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-zinc-800" />
              Cloudinary Media &amp; CDN Storage
            </h1>
            <Badge variant="success">CLOUD: besmhzyh</Badge>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            High-performance CDN storage for property photos, 4K video walk-throughs, automotive fleet specs, and commercial assets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setUploadModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Upload Media to Cloudinary
          </Button>
        </div>
      </div>

      {/* Cloudinary Integration Status Card */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              CL
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span>Cloudinary Connected Successfully</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-[11px] text-zinc-600 font-mono mt-0.5">
                Cloud Name: <strong>besmhzyh</strong> • Auto Format &amp; Quality Active
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white text-[10px]">
              Images + Videos Supported
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Global Edge CDN
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All Media Assets', count: assets.length },
          { id: 'images', label: 'Images', count: assets.filter((a) => a.resourceType === 'image').length },
          { id: 'videos', label: 'Videos & Walkthroughs', count: assets.filter((a) => a.resourceType === 'video').length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Gallery Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-zinc-300">
          <UploadCloud className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-800 text-sm">No media assets in this view</h3>
          <p className="text-xs text-zinc-500 mt-1">Upload images or videos directly to Cloudinary.</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Media
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <Card
              key={asset.publicId}
              className="border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-all shadow-sm flex flex-col justify-between bg-white"
            >
              <div>
                {/* Media Preview Container */}
                <div
                  className="relative h-48 w-full bg-zinc-100 flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => setPreviewMedia(asset)}
                >
                  {asset.resourceType === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                      <video
                        src={asset.secureUrl}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-11 w-11 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 ml-0.5" />
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white border-0"
                      >
                        VIDEO
                      </Badge>
                    </div>
                  ) : (
                    <img
                      src={asset.secureUrl}
                      alt={asset.publicId}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white/90 backdrop-blur text-[10px] font-mono">
                      {asset.format?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-mono text-[11px] truncate max-w-[180px]">
                      {asset.publicId?.split('/').pop() || asset.fileName || 'asset'}
                    </span>
                    <span className="font-mono">{formatSize(asset.bytes)}</span>
                  </div>

                  {asset.width && asset.height && (
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Dimensions: {asset.width} × {asset.height} px
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={() => handleCopy(asset.publicId, asset.secureUrl)}
                >
                  {copiedId === asset.publicId ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-600"
                  onClick={() => setPreviewMedia(asset)}
                >
                  Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Image or Video to Cloudinary"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-600">
            Files are streamed directly to your Cloudinary storage environment (<strong>besmhzyh</strong>) and assigned automatic format optimizations and responsive CDN URLs.
          </p>

          <MediaUploader
            folder="platform-media"
            acceptedTypes="all"
            maxSizeMB={100}
            onUploadSuccess={handleUploadSuccess}
          />

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Media Inspection & Fullscreen Preview Modal */}
      <Modal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        title={`Asset Inspector: ${previewMedia?.publicId?.split('/').pop() || previewMedia?.fileName || 'Asset'}`}
      >
        {previewMedia && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center max-h-96">
              {previewMedia.resourceType === 'video' ? (
                <video
                  src={previewMedia.secureUrl}
                  controls
                  autoPlay
                  className="max-h-96 w-full object-contain"
                />
              ) : (
                <img
                  src={previewMedia.secureUrl}
                  alt={previewMedia.publicId || 'Preview'}
                  className="max-h-96 w-full object-contain"
                />
              )}
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Public ID:</span>
                <span className="font-semibold text-zinc-800">{previewMedia.publicId || 'Direct Asset'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Format:</span>
                <span className="text-zinc-800">{previewMedia.format?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">File Size:</span>
                <span className="text-zinc-800">{formatSize(previewMedia.bytes)}</span>
              </div>
              {previewMedia.width && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Resolution:</span>
                  <span className="text-zinc-800">{previewMedia.width} × {previewMedia.height}</span>
                </div>
              )}
              <div className="pt-1 border-t border-zinc-200 truncate">
                <span className="text-zinc-500 block mb-0.5">CDN Delivery URL:</span>
                <span className="text-blue-700 text-[11px] select-all">{previewMedia.secureUrl}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPreviewMedia(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCopy(previewMedia.publicId, previewMedia.secureUrl)}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy CDN URL
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
