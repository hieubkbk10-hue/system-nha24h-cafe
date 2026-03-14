'use client';

import type { DragEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { GripVertical, Image as ImageIcon, Link, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, cn } from './ui';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
export interface ImageItem {
  id: string | number;
  url: string;
  storageId?: string;
  [key: string]: unknown; // Allow extra fields like link, title, etc.
}

interface MultiImageUploaderProps<T extends ImageItem> {
  items: T[];
  onChange: (items: T[]) => void;
  folder?: string;
  className?: string;
  imageKey?: keyof T; // Which field contains the image URL (default: 'url')
  extraFields?: {
    key: keyof T;
    placeholder: string;
    type?: 'text' | 'url';
  }[];
  maxItems?: number;
  minItems?: number;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  columns?: 1 | 2 | 3 | 4;
  showReorder?: boolean;
  addButtonText?: string;
  emptyText?: string;
  layout?: 'horizontal' | 'vertical'; // Vertical: image on top, fields below (better for cards)
}

export function MultiImageUploader<T extends ImageItem>({
  items,
  onChange,
  folder = 'home-components',
  className,
  imageKey = 'url' as keyof T,
  extraFields = [],
  maxItems = 20,
  minItems = 1,
  aspectRatio = 'video',
  columns = 1,
  showReorder = true,
  addButtonText = 'Thêm ảnh',
  emptyText = 'Chưa có ảnh nào',
  layout = 'horizontal',
}: MultiImageUploaderProps<T>) {
  const itemsRef = useRef(items);
  const [uploadingIds, setUploadingIds] = useState<Set<string | number>>(new Set());
  const [urlModeIds, setUrlModeIds] = useState<Set<string | number>>(new Set());
  const [brokenIds, setBrokenIds] = useState<Set<string | number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState<string | number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | number | null>(null);
  const [fileDragOverItemId, setFileDragOverItemId] = useState<string | number | null>(null); // For file drops on specific items
  const inputRefs = useRef<Map<string | number, HTMLInputElement>>(new Map());
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const deleteImage = useMutation(api.storage.deleteImage);

  const markBroken = useCallback((itemId: string | number) => {
    setBrokenIds(prev => new Set(prev).add(itemId));
  }, []);

  const clearBroken = useCallback((itemId: string | number) => {
    setBrokenIds(prev => {
      if (!prev.has(itemId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const aspectClasses = {
    auto: 'min-h-[100px]',
    banner: 'aspect-[3/1]',
    square: 'aspect-square',
    video: 'aspect-video',
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  const handleFileUpload = useCallback(async (itemId: string | number, file: File) => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingIds(prev => new Set(prev).add(itemId));

    try {
      const prepared = await prepareImageForUpload(file);
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {throw new Error('Upload failed');}

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

      onChange(itemsRef.current.map(item => 
        item.id === itemId 
          ? { ...item, [imageKey]: result.url ?? '', storageId } as T
          : item
      ));
      clearBroken(itemId);

      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [generateUploadUrl, saveImage, folder, imageKey, onChange, clearBroken]);

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    const filesToUpload = [...files];
    
    // If there's exactly 1 item with no image, upload first file to it
    const firstEmptyItem = items.find(item => !item[imageKey]);
    if (firstEmptyItem && filesToUpload.length > 0) {
      // Start uploading first file to empty item (don't await)
      const firstUploadPromise = handleFileUpload(firstEmptyItem.id, filesToUpload[0]);
      
      // Upload remaining files as new items in parallel
      const remainingFiles = filesToUpload.slice(1);
      if (remainingFiles.length > 0) {
        const remainingSlots = maxItems - items.length;
        const filesToAdd = remainingFiles.slice(0, remainingSlots);
        
        if (filesToAdd.length > 0) {
          const newItems: T[] = filesToAdd.map((_, index) => ({
            id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 4)}`,
            [imageKey]: '',
          } as unknown as T));

          const updatedItems = [...items, ...newItems];
          onChange(updatedItems);

          // Upload all in parallel using Promise.all
          const uploadPromises = filesToAdd.map( async (file, i) => handleFileUpload(newItems[i].id, file));
          await Promise.all([firstUploadPromise, ...uploadPromises]);
          return;
        }
      }
      await firstUploadPromise;
      return;
    }

    // Normal flow: create new items for all files
    const remainingSlots = maxItems - items.length;
    const filesToAdd = filesToUpload.slice(0, remainingSlots);

    if (filesToAdd.length < filesToUpload.length) {
      toast.warning(`Chỉ có thể thêm ${remainingSlots} ảnh nữa`);
    }

    if (filesToAdd.length === 0) {
      toast.error(`Đã đạt giới hạn ${maxItems} ảnh`);
      return;
    }

    const newItems: T[] = filesToAdd.map((_, index) => ({
      id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 4)}`,
      [imageKey]: '',
    } as unknown as T));

    const updatedItems = [...items, ...newItems];
    onChange(updatedItems);

    // Upload all files in parallel using Promise.all
    await Promise.all(filesToAdd.map( async (file, i) => handleFileUpload(newItems[i].id, file)));
  }, [items, maxItems, imageKey, onChange, handleFileUpload]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if leaving the container entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
    setDragOverItemId(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemId !== undefined) {
      setDragOverItemId(itemId);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent, itemId?: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragOverItemId(null);
    setFileDragOverItemId(null);
    
    const {files} = e.dataTransfer;
    if (files.length === 0) {return;}
    
    if (itemId !== undefined) {
      // Drop on specific item
      if (files[0]) {void handleFileUpload(itemId, files[0]);}
    } else {
      // Drop on container - add new items
      void handleMultipleFiles(files);
    }
  }, [handleFileUpload, handleMultipleFiles]);

  // File drag handlers for individual items
  const handleItemFileDragEnter = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
  }, []);

  const handleItemFileDragOver = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setFileDragOverItemId(itemId);
  }, []);

  const handleItemFileDrop = useCallback((e: React.DragEvent, itemId: string | number) => {
    if (!e.dataTransfer.types.includes('Files')) {return;}
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverItemId(null);
    setIsDragging(false);
    
    const {files} = e.dataTransfer;
    if (files.length > 0 && files[0]) {
      void handleFileUpload(itemId, files[0]);
    }
  }, [handleFileUpload]);

  const handleUrlChange = useCallback((itemId: string | number, url: string) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, [imageKey]: url, storageId: undefined } as T : item
    ));
    clearBroken(itemId);
  }, [items, imageKey, onChange, clearBroken]);

  const handleExtraFieldChange = useCallback((itemId: string | number, fieldKey: keyof T, value: string) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, [fieldKey]: value } as T : item
    ));
  }, [items, onChange]);

  const handleRemove = useCallback(async (itemId: string | number) => {
    if (items.length <= minItems) {
      toast.error(`Cần tối thiểu ${minItems} mục`);
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (item?.storageId) {
      try {
        await deleteImage({ storageId: item.storageId as Id<"_storage"> });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    onChange(items.filter(i => i.id !== itemId));
  }, [items, minItems, deleteImage, onChange]);

  const handleItemDragStart = useCallback((e: React.DragEvent, itemId: string | number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(itemId));
    setDraggedItemId(itemId);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, []);

  const handleItemDragOver = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItemId && draggedItemId !== targetId) {
      setDragOverItemId(targetId);
    }
  }, [draggedItemId]);

  const handleItemDrop = useCallback((e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const dragIndex = itemsRef.current.findIndex(item => item.id === draggedItemId);
    const dropIndex = itemsRef.current.findIndex(item => item.id === targetId);

    if (dragIndex === -1 || dropIndex === -1) {return;}

    const newItems = [...itemsRef.current];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    onChange(newItems);

    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [draggedItemId, onChange]);

  const handleAdd = useCallback(() => {
    if (items.length >= maxItems) {
      toast.error(`Tối đa ${maxItems} mục`);
      return;
    }
    const newItem = {
      id: `new-${Date.now()}`,
      [imageKey]: '',
      ...extraFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}),
    } as unknown as T;
    onChange([...items, newItem]);
  }, [items, maxItems, imageKey, extraFields, onChange]);

  const toggleUrlMode = useCallback((itemId: string | number) => {
    setUrlModeIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const inputId = `multi-image-input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div 
      ref={dropZoneRef}
      className={cn('space-y-4', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) =>{  handleDragOver(e); }}
      onDrop={(e) =>{  handleDrop(e); }}
    >
      {/* Drop zone for adding new images */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]" 
            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.click();
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)}
          className="hidden"
          id={inputId}
        />
        <Upload size={32} className={cn("mx-auto mb-3 transition-colors", isDragging ? "text-blue-500" : "text-slate-400")} />
        <p className={cn("text-sm font-medium", isDragging ? "text-blue-600" : "text-slate-600 dark:text-slate-300")}>
          {isDragging ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh hoặc click để chọn'}
        </p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF - Tự động chuyển WebP</p>
      </div>

      {/* Items grid */}
      {items.length > 0 ? (
        <div className={cn('grid gap-4', columnClasses[columns])}>
          {items.map((item) => {
            const imageUrl = item[imageKey] as string;
            const isUploading = uploadingIds.has(item.id);
            const isUrlMode = urlModeIds.has(item.id);
            const isDraggedItem = draggedItemId === item.id;
            const isDragOverItem = dragOverItemId === item.id && draggedItemId !== null;
            const isFileDragOver = fileDragOverItemId === item.id;
            const isBroken = brokenIds.has(item.id);

            // Vertical layout - card style với ảnh trên, input bên dưới
            if (layout === 'vertical') {
              return (
                <div
                  key={item.id}
                  draggable={showReorder}
                  onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                  onDragEnd={handleItemDragEnd}
                  onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                  onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                  className={cn(
                    "bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden transition-all duration-200",
                    isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                    isDraggedItem && "opacity-50 scale-95",
                    showReorder && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {/* Image area */}
                  <div
                    className={cn(
                      'relative w-full rounded-t-lg overflow-hidden border-2 border-b-0 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-700',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn("object-cover transition-opacity", isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                        <ImageIcon size={32} className="text-slate-400" />
                      </div>
                    )}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={24} className="text-blue-600 mb-1" />
                        <span className="text-sm font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    {/* Reorder & Delete buttons overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between">
                      {showReorder && (
                        <div className="bg-white/90 dark:bg-slate-800/90 rounded p-1">
                          <GripVertical size={16} className="text-slate-500" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-white/90 dark:bg-slate-800/90 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); void handleRemove(item.id); }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && void handleFileUpload(item.id, e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  {/* Bottom area: fields */}
                  <div className="p-3 space-y-2 border-2 border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg">
                    {/* Toggle URL mode - compact */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          !isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200'
                        )}
                      >
                        <Upload size={10} /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => !isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200'
                        )}
                      >
                        <Link size={10} /> URL
                      </button>
                    </div>
                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-9 text-sm"
                      />
                    ))}
                  </div>
                </div>
              );
            }

            // Horizontal layout (default) - ảnh bên trái, fields bên phải
            return (
              <div
                key={item.id}
                draggable={showReorder}
                onDragStart={(e) =>{  handleItemDragStart(e, item.id); }}
                onDragEnd={handleItemDragEnd}
                onDragOver={(e) =>{  handleItemDragOver(e, item.id); }}
                onDrop={(e) =>{  handleItemDrop(e, item.id); }}
                className={cn(
                  "bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-3 transition-all duration-200",
                  isDragOverItem && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                  isDraggedItem && "opacity-50 scale-95",
                  showReorder && "cursor-grab active:cursor-grabbing"
                )}
              >
                {/* Image preview / upload area */}
                <div className="flex gap-3">
                  {showReorder && (
                    <div className="flex flex-col justify-center">
                      <GripVertical size={18} className="text-slate-400 hover:text-slate-600" />
                    </div>
                  )}

                  {/* Image drop zone - supports drag & drop files */}
                  <div
                    className={cn(
                      'relative flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all duration-200',
                      isFileDragOver 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105 shadow-lg' 
                        : 'border-slate-200 dark:border-slate-700',
                      aspectClasses[aspectRatio],
                      !isUrlMode && 'cursor-pointer hover:border-blue-400'
                    )}
                    onClick={() => !isUploading && !isUrlMode && inputRefs.current.get(item.id)?.click()}
                    onDragEnter={(e) =>{  handleItemFileDragEnter(e, item.id); }}
                    onDragLeave={handleItemFileDragLeave}
                    onDragOver={(e) =>{  handleItemFileDragOver(e, item.id); }}
                    onDrop={(e) =>{  handleItemFileDrop(e, item.id); }}
                  >
                    {imageUrl && !isBroken ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className={cn("object-cover transition-opacity", isFileDragOver && "opacity-50")}
                        onError={() => markBroken(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                        <ImageIcon size={24} className="text-slate-400" />
                      </div>
                    )}
                    {/* File drag overlay */}
                    {isFileDragOver && (
                      <div className="absolute inset-0 bg-blue-500/20 flex flex-col items-center justify-center">
                        <Upload size={20} className="text-blue-600 mb-1" />
                        <span className="text-xs font-medium text-blue-600">Thả ảnh</span>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                      </div>
                    )}
                    <input
                      ref={(el) => { if (el) {inputRefs.current.set(item.id, el);} }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && void handleFileUpload(item.id, e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Toggle URL mode */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          !isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        )}
                      >
                        <Upload size={12} /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => !isUrlMode && toggleUrlMode(item.id)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                          isUrlMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        )}
                      >
                        <Link size={12} /> URL
                      </button>
                    </div>

                    {isUrlMode && (
                      <Input
                        value={imageUrl}
                        onChange={(e) =>{  handleUrlChange(item.id, e.target.value); }}
                        placeholder="https://example.com/image.jpg"
                        className="h-8 text-sm"
                      />
                    )}

                    {/* Extra fields */}
                    {extraFields.map((field) => (
                      <Input
                        key={String(field.key)}
                        value={String(item[field.key] || '')}
                        onChange={(e) =>{  handleExtraFieldChange(item.id, field.key, e.target.value); }}
                        placeholder={field.placeholder}
                        className="h-8 text-sm"
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 flex-shrink-0"
                    onClick={ async () => handleRemove(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">{emptyText}</div>
      )}

      {/* Add button */}
      {items.length < maxItems && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full gap-2">
          <Plus size={14} /> {addButtonText}
        </Button>
      )}
    </div>
  );
}
