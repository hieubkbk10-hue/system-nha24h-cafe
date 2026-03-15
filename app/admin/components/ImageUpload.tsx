'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ImageOff, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, cn } from './ui';
import { prepareImageForUpload, type SquareCropSelection, validateImageFile } from '@/lib/image/uploadPipeline';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  folder?: string;
  className?: string;
  enableSquareCrop?: boolean;
}

const CROP_VIEW_SIZE = 320;

export function ImageUpload({ value, onChange, folder = 'products', className, enableSquareCrop = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropXPercent, setCropXPercent] = useState(0.5);
  const [cropYPercent, setCropYPercent] = useState(0.5);
  const [sourceDimensions, setSourceDimensions] = useState<{ width: number; height: number } | null>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const inputId = useMemo(() => `image-upload-input-${Math.random().toString(36).slice(2, 9)}`, []);
  const isCropOpen = Boolean(cropFile && cropPreviewUrl);

  useEffect(() => {
    setHasError(false);
  }, [value]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  const handleUpload = useCallback(async (file: File, crop?: SquareCropSelection) => {
    setIsUploading(true);
    try {
      const prepared = await prepareImageForUpload(file, crop ? { crop } : undefined);
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await response.json();

      const result = await saveImage({
        filename: prepared.filename,
        folder,
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });

      if (result.url) {
        onChange(result.url);
        toast.success('Tải ảnh lên thành công');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, saveImage, folder, onChange]);

  const resetCropState = useCallback(() => {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }
    setCropFile(null);
    setCropPreviewUrl(null);
    setSourceDimensions(null);
    setCropScale(1);
    setCropXPercent(0.5);
    setCropYPercent(0.5);
  }, [cropPreviewUrl]);

  const openCropper = useCallback((file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    setCropFile(file);
    setCropPreviewUrl(URL.createObjectURL(file));
    setSourceDimensions(null);
    setCropScale(1);
    setCropXPercent(0.5);
    setCropYPercent(0.5);
  }, [cropPreviewUrl]);

  const handleSelectedFile = useCallback((file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (enableSquareCrop) {
      openCropper(file);
      return;
    }

    void handleUpload(file);
  }, [enableSquareCrop, handleUpload, openCropper]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  }, [handleSelectedFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  const renderedSize = useMemo(() => {
    if (!sourceDimensions) {
      return null;
    }

    const coverScale = Math.max(CROP_VIEW_SIZE / sourceDimensions.width, CROP_VIEW_SIZE / sourceDimensions.height);
    return {
      width: sourceDimensions.width * coverScale * cropScale,
      height: sourceDimensions.height * coverScale * cropScale,
    };
  }, [sourceDimensions, cropScale]);

  const previewStyle = useMemo(() => {
    if (!renderedSize) {
      return undefined;
    }

    const maxOffsetX = Math.max(0, renderedSize.width - CROP_VIEW_SIZE);
    const maxOffsetY = Math.max(0, renderedSize.height - CROP_VIEW_SIZE);

    return {
      height: renderedSize.height,
      left: -(maxOffsetX * cropXPercent),
      top: -(maxOffsetY * cropYPercent),
      width: renderedSize.width,
    };
  }, [renderedSize, cropXPercent, cropYPercent]);

  const handleConfirmCrop = async () => {
    if (!cropFile) {
      return;
    }

    await handleUpload(cropFile, {
      scale: cropScale,
      xPercent: cropXPercent,
      yPercent: cropYPercent,
    });
    resetCropState();
  };

  if (value) {
    return (
      <div className={cn("relative h-40 w-full", className)}>
        {!hasError ? (
          <Image
            src={value}
            alt="Uploaded"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover rounded-lg border border-slate-200 dark:border-slate-700"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <ImageOff size={24} />
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
          onClick={handleRemove}
        >
          <X size={16} className="text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6",
          "flex flex-col items-center justify-center cursor-pointer",
          "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
          isUploading && "pointer-events-none opacity-50",
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 size={24} className="text-orange-500 animate-spin mb-2" />
            <span className="text-sm text-slate-500">Đang tải lên...</span>
          </>
        ) : (
          <>
            <Upload size={24} className="text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">Kéo thả hoặc click để tải lên</span>
            <span className="text-xs text-slate-400 mt-1">Tối đa 5MB, nén 85%</span>
          </>
        )}
      </div>

      <Dialog open={isCropOpen} onOpenChange={(open) => { if (!open) {resetCropState();} }}>
        <DialogContent className="max-w-[92vw] w-[560px]">
          <DialogHeader>
            <DialogTitle>Cắt ảnh vuông 1:1</DialogTitle>
            <DialogDescription>Điều chỉnh vùng cắt trước khi tải lên.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto relative h-[320px] w-[320px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              {cropPreviewUrl && (
                <img
                  src={cropPreviewUrl}
                  alt="Crop preview"
                  className="absolute max-w-none"
                  style={previewStyle}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setSourceDimensions({
                      width: image.naturalWidth,
                      height: image.naturalHeight,
                    });
                  }}
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Zoom ({cropScale.toFixed(1)}x)
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={cropScale}
                  onChange={(e) => setCropScale(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Dịch ngang
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={cropXPercent}
                  onChange={(e) => setCropXPercent(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Dịch dọc
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={cropYPercent}
                  onChange={(e) => setCropYPercent(Number(e.target.value))}
                  className="mt-1 w-full"
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetCropState} disabled={isUploading}>Hủy</Button>
            <Button type="button" variant="accent" onClick={() => { void handleConfirmCrop(); }} disabled={isUploading || !sourceDimensions}>
              {isUploading && <Loader2 size={16} className="animate-spin mr-2" />}
              Dùng ảnh đã cắt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
