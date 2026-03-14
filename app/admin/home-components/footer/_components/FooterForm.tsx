'use client';

import React, { useMemo, useState } from 'react';
import { Download, GripVertical, LayoutGrid, Plus, Share2, Trash2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { getFooterLayoutColors } from '../_lib/colors';
import type { FooterBrandMode, FooterConfig, FooterColumn, FooterSocialLink } from '../_types';

interface FooterFormProps {
  value: FooterConfig;
  onChange: (next: FooterConfig) => void;
  primary: string;
  secondary: string;
  mode: FooterBrandMode;
}

const SOCIAL_PLATFORMS = [
  { icon: 'facebook', key: 'facebook', label: 'Facebook' },
  { icon: 'instagram', key: 'instagram', label: 'Instagram' },
  { icon: 'youtube', key: 'youtube', label: 'Youtube' },
  { icon: 'tiktok', key: 'tiktok', label: 'TikTok' },
  { icon: 'zalo', key: 'zalo', label: 'Zalo' },
  { icon: 'x', key: 'x', label: 'X (Twitter)' },
  { icon: 'pinterest', key: 'pinterest', label: 'Pinterest' },
];

const getNextId = (items: Array<{ id?: number | string }>) => {
  const max = items.reduce((acc, item) => {
    const asNumber = typeof item.id === 'number' ? item.id : Number(item.id);
    return Number.isFinite(asNumber) ? Math.max(acc, asNumber) : acc;
  }, 0);
  return max + 1;
};

export function FooterForm({ value, onChange, primary, secondary, mode }: FooterFormProps) {
  const siteLogo = useQuery(api.settings.getByKey, { key: 'site_logo' });
  const socialFacebook = useQuery(api.settings.getByKey, { key: 'social_facebook' });
  const socialInstagram = useQuery(api.settings.getByKey, { key: 'social_instagram' });
  const socialYoutube = useQuery(api.settings.getByKey, { key: 'social_youtube' });
  const socialTiktok = useQuery(api.settings.getByKey, { key: 'social_tiktok' });
  const socialZalo = useQuery(api.settings.getByKey, { key: 'contact_zalo' });

  const columnsWithId = useMemo<FooterColumn[]>(() => value.columns.map((column, index) => ({
    ...column,
    id: column.id ?? index + 1,
  })), [value.columns]);

  const socialsWithId = useMemo<FooterSocialLink[]>(() => value.socialLinks.map((social, index) => ({
    ...social,
    id: social.id ?? index + 1,
  })), [value.socialLinks]);

  const [draggedColumnId, setDraggedColumnId] = useState<number | string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<number | string | null>(null);
  const [draggedSocialId, setDraggedSocialId] = useState<number | string | null>(null);
  const [dragOverSocialId, setDragOverSocialId] = useState<number | string | null>(null);

  const colors = useMemo(() => getFooterLayoutColors(value.style ?? 'classic', primary, secondary, mode), [mode, primary, secondary, value.style]);
  const bctLogoType = value.bctLogoType ?? 'thong-bao';
  const bctLogoSrc = bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.png'
    : '/images/bct/logo-da-thong-bao-bct.png';
  const logoSizeLevel = value.logoSizeLevel ?? 1;

  const updateConfig = (patch: Partial<FooterConfig>) => {
    onChange({ ...value, ...patch });
  };

  const loadFromSettings = () => {
    const newSocialLinks: FooterSocialLink[] = [];
    let idCounter = 1;

    if (socialFacebook?.value) {
      newSocialLinks.push({ icon: 'facebook', id: idCounter++, platform: 'facebook', url: socialFacebook.value as string });
    }
    if (socialInstagram?.value) {
      newSocialLinks.push({ icon: 'instagram', id: idCounter++, platform: 'instagram', url: socialInstagram.value as string });
    }
    if (socialYoutube?.value) {
      newSocialLinks.push({ icon: 'youtube', id: idCounter++, platform: 'youtube', url: socialYoutube.value as string });
    }
    if (socialTiktok?.value) {
      newSocialLinks.push({ icon: 'tiktok', id: idCounter++, platform: 'tiktok', url: socialTiktok.value as string });
    }
    if (socialZalo?.value) {
      newSocialLinks.push({ icon: 'zalo', id: idCounter++, platform: 'zalo', url: socialZalo.value as string });
    }

    updateConfig({
      logo: (siteLogo?.value as string) || value.logo,
      socialLinks: newSocialLinks.length > 0 ? newSocialLinks : socialsWithId,
    });
    toast.success('Đã load dữ liệu từ Settings');
  };

  const handleColumnDragStart = (columnId: number | string) => { setDraggedColumnId(columnId); };
  const handleColumnDragEnd = () => { setDraggedColumnId(null); setDragOverColumnId(null); };
  const handleColumnDragOver = (e: React.DragEvent, columnId: number | string) => {
    e.preventDefault();
    if (draggedColumnId !== columnId) {setDragOverColumnId(columnId);}
  };
  const handleColumnDrop = (e: React.DragEvent, targetId: number | string) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetId) {return;}
    const newColumns = [...columnsWithId];
    const draggedIndex = newColumns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = newColumns.findIndex(c => c.id === targetId);
    const [moved] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, moved);
    updateConfig({ columns: newColumns });
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };

  const handleSocialDragStart = (socialId: number | string) => { setDraggedSocialId(socialId); };
  const handleSocialDragEnd = () => { setDraggedSocialId(null); setDragOverSocialId(null); };
  const handleSocialDragOver = (e: React.DragEvent, socialId: number | string) => {
    e.preventDefault();
    if (draggedSocialId !== socialId) {setDragOverSocialId(socialId);}
  };
  const handleSocialDrop = (e: React.DragEvent, targetId: number | string) => {
    e.preventDefault();
    if (!draggedSocialId || draggedSocialId === targetId) {return;}
    const newSocials = [...socialsWithId];
    const draggedIndex = newSocials.findIndex(s => s.id === draggedSocialId);
    const targetIndex = newSocials.findIndex(s => s.id === targetId);
    const [moved] = newSocials.splice(draggedIndex, 1);
    newSocials.splice(targetIndex, 0, moved);
    updateConfig({ socialLinks: newSocials });
    setDraggedSocialId(null);
    setDragOverSocialId(null);
  };

  const addColumn = () => {
    const newId = getNextId(columnsWithId);
    updateConfig({
      columns: [...columnsWithId, { id: newId, links: [{ label: 'Link mới', url: '#' }], title: `Cột ${newId}` }],
    });
  };

  const removeColumn = (columnId: number | string) => {
    updateConfig({
      columns: columnsWithId.filter(c => c.id !== columnId),
    });
  };

  const updateColumn = (columnId: number | string, field: 'title', valueInput: string) => {
    updateConfig({
      columns: columnsWithId.map(c => c.id === columnId ? { ...c, [field]: valueInput } : c),
    });
  };

  const addLink = (columnId: number | string) => {
    updateConfig({
      columns: columnsWithId.map(c =>
        c.id === columnId ? { ...c, links: [...c.links, { label: 'Link mới', url: '#' }] } : c
      ),
    });
  };

  const removeLink = (columnId: number | string, linkIndex: number) => {
    updateConfig({
      columns: columnsWithId.map(c =>
        c.id === columnId ? { ...c, links: c.links.filter((_, idx) => idx !== linkIndex) } : c
      ),
    });
  };

  const updateLink = (columnId: number | string, linkIndex: number, field: 'label' | 'url', valueInput: string) => {
    updateConfig({
      columns: columnsWithId.map(c =>
        c.id === columnId ? {
          ...c,
          links: c.links.map((link, idx) => idx === linkIndex ? { ...link, [field]: valueInput } : link),
        } : c
      ),
    });
  };

  const addSocialLink = () => {
    const usedPlatforms = new Set(socialsWithId.map(s => s.platform));
    const availablePlatform = SOCIAL_PLATFORMS.find(p => !usedPlatforms.has(p.key));
    if (!availablePlatform) {
      toast.error('Đã thêm đủ tất cả mạng xã hội');
      return;
    }
    const newId = getNextId(socialsWithId);
    updateConfig({
      socialLinks: [...socialsWithId, { icon: availablePlatform.icon, id: newId, platform: availablePlatform.key, url: '' }],
    });
  };

  const removeSocialLink = (id: number | string) => {
    updateConfig({
      socialLinks: socialsWithId.filter(s => s.id !== id),
    });
  };

  const updateSocialLink = (id: number | string, field: 'platform' | 'url', valueInput: string) => {
    updateConfig({
      socialLinks: socialsWithId.map(s => {
        if (s.id !== id) {return s;}
        if (field === 'platform') {
          const platform = SOCIAL_PLATFORMS.find(p => p.key === valueInput);
          return { ...s, platform: valueInput, icon: platform?.icon ?? valueInput };
        }
        return { ...s, [field]: valueInput };
      }),
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={loadFromSettings}>
          <Download size={14} className="mr-1" /> Load từ Settings
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo</Label>
            <SettingsImageUploader
              value={value.logo}
              onChange={(url) =>{  updateConfig({ logo: url ?? '' }); }}
              folder="footer"
              previewSize="sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Kích thước logo</Label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={logoSizeLevel}
              onChange={(event) =>{  updateConfig({ logoSizeLevel: Number(event.target.value) as FooterConfig['logoSizeLevel'] }); }}
              className="w-full"
            />
            <div className="text-xs font-medium text-slate-600">Nấc {logoSizeLevel}/10</div>
          </div>
          <div className="space-y-2">
            <Label>Mô tả công ty</Label>
            <textarea
              value={value.description}
              onChange={(e) =>{  updateConfig({ description: e.target.value }); }}
              placeholder="Công ty TNHH ABC - Đối tác tin cậy của bạn"
              className="w-full min-h-[60px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.showCopyright !== false}
                onChange={(e) =>{  updateConfig({ showCopyright: e.target.checked }); }}
                className="w-4 h-4 rounded"
              />
              <Label>Hiển thị Copyright</Label>
            </div>
            {value.showCopyright !== false && (
              <div className="space-y-1">
                <Input
                  value={value.copyright}
                  onChange={(e) =>{  updateConfig({ copyright: e.target.value }); }}
                  placeholder={`© ${new Date().getFullYear()} Tên Web. All rights reserved.`}
                />
                <p className="text-xs text-slate-400">
                  Để trống = tự động dùng: © {new Date().getFullYear()} Tên web từ Settings. All rights reserved.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showSocialLinks !== false}
              onChange={(e) =>{  updateConfig({ showSocialLinks: e.target.checked }); }}
              className="w-4 h-4 rounded"
            />
            <Label>Hiển thị social links</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.useOriginalSocialIconColors !== false}
              onChange={(e) =>{  updateConfig({ useOriginalSocialIconColors: e.target.checked }); }}
              className="w-4 h-4 rounded"
            />
            <Label>Dùng màu icon gốc</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Bộ Công Thương</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.showBctLogo === true}
              onChange={(e) =>{  updateConfig({ showBctLogo: e.target.checked }); }}
              className="w-4 h-4 rounded"
            />
            <Label>Hiển thị logo BCT</Label>
          </div>
          {value.showBctLogo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loại logo</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name="bct-logo-type"
                      value="thong-bao"
                      checked={bctLogoType === 'thong-bao'}
                      onChange={() =>{  updateConfig({ bctLogoType: 'thong-bao' }); }}
                    />
                    <img src="/images/bct/logo-da-thong-bao-bct.png" alt="Đã thông báo" className="h-8 w-auto" />
                    <span>Đã thông báo</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name="bct-logo-type"
                      value="dang-ky"
                      checked={bctLogoType === 'dang-ky'}
                      onChange={() =>{  updateConfig({ bctLogoType: 'dang-ky' }); }}
                    />
                    <img src="/images/bct/logo-da-dang-ky-bct.png" alt="Đã đăng ký" className="h-8 w-auto" />
                    <span>Đã đăng ký</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link xác thực BCT (tuỳ chọn)</Label>
                <Input
                  value={value.bctLogoLink ?? ''}
                  onChange={(e) =>{  updateConfig({ bctLogoLink: e.target.value }); }}
                  placeholder="https://online.gov.vn/Home/WebSiteDisplay/..."
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Preview:</span>
                <img src={bctLogoSrc} alt="BCT Logo" className="h-8 w-auto" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cột menu ({columnsWithId.length}/4)</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColumn}
              disabled={columnsWithId.length >= 4}
              title={columnsWithId.length >= 4 ? 'Tối đa 4 cột menu' : ''}
            >
              <Plus size={14} className="mr-1" /> Thêm cột
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {columnsWithId.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.borderSoft}` }}
              >
                <LayoutGrid size={24} style={{ color: colors.accent }} />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có cột menu</h3>
              <p className="text-sm text-slate-500 mb-3">Nhấn “Thêm cột” để tạo menu footer</p>
              <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                <Plus size={14} className="mr-1" /> Thêm cột đầu tiên
              </Button>
            </div>
          ) : (
            columnsWithId.map((column) => (
              <div
                key={column.id}
                draggable
                onDragStart={() =>{  handleColumnDragStart(column.id ?? 0); }}
                onDragEnd={handleColumnDragEnd}
                onDragOver={(e) =>{  handleColumnDragOver(e, column.id ?? 0); }}
                onDrop={(e) =>{  handleColumnDrop(e, column.id ?? 0); }}
                className={cn(
                  'border rounded-lg p-4 space-y-3 transition-all',
                  draggedColumnId === column.id && 'opacity-50',
                  dragOverColumnId === column.id && 'ring-2 ring-blue-500 ring-offset-2',
                  'border-slate-200 dark:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-slate-400 cursor-grab flex-shrink-0" />
                  <Input
                    value={column.title}
                    onChange={(e) =>{  updateColumn(column.id ?? 0, 'title', e.target.value); }}
                    placeholder="Tiêu đề cột"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>{  removeColumn(column.id ?? 0); }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="pl-6 space-y-2">
                  <Label className="text-xs text-slate-500">Links ({column.links.length})</Label>
                  {column.links.map((link, linkIdx) => (
                    <div key={linkIdx} className="flex items-center gap-2">
                      <Input
                        value={link.label}
                        onChange={(e) =>{  updateLink(column.id ?? 0, linkIdx, 'label', e.target.value); }}
                        placeholder="Tên link"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) =>{  updateLink(column.id ?? 0, linkIdx, 'url', e.target.value); }}
                        placeholder="/url"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>{  removeLink(column.id ?? 0, linkIdx); }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        disabled={column.links.length <= 1}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>{  addLink(column.id ?? 0); }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <Plus size={12} className="mr-1" /> Thêm link
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Mạng xã hội ({socialsWithId.length}/{SOCIAL_PLATFORMS.length})</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSocialLink}
              disabled={socialsWithId.length >= SOCIAL_PLATFORMS.length}
              title={socialsWithId.length >= SOCIAL_PLATFORMS.length ? 'Đã thêm đủ tất cả mạng xã hội' : ''}
            >
              <Plus size={14} className="mr-1" /> Thêm MXH
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {socialsWithId.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.borderSoft}` }}
              >
                <Share2 size={24} style={{ color: colors.accent }} />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có mạng xã hội</h3>
              <p className="text-sm text-slate-500 mb-3">Thêm MXH hoặc load từ Settings</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={loadFromSettings}>
                  <Download size={14} className="mr-1" /> Load từ Settings
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                  <Plus size={14} className="mr-1" /> Thêm MXH
                </Button>
              </div>
            </div>
          ) : (
            socialsWithId.map((social) => (
              <div
                key={social.id}
                draggable
                onDragStart={() =>{  handleSocialDragStart(social.id ?? 0); }}
                onDragEnd={handleSocialDragEnd}
                onDragOver={(e) =>{  handleSocialDragOver(e, social.id ?? 0); }}
                onDrop={(e) =>{  handleSocialDrop(e, social.id ?? 0); }}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-all',
                  draggedSocialId === social.id && 'opacity-50',
                  dragOverSocialId === social.id && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                )}
              >
                <GripVertical size={16} className="text-slate-400 cursor-grab flex-shrink-0" />
                <select
                  value={social.platform}
                  onChange={(e) =>{  updateSocialLink(social.id ?? 0, 'platform', e.target.value); }}
                  className="w-36 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                >
                  {SOCIAL_PLATFORMS.map(p => (
                    <option
                      key={p.key}
                      value={p.key}
                      disabled={socialsWithId.some(s => s.platform === p.key && s.id !== social.id)}
                    >
                      {p.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={social.url}
                  onChange={(e) =>{  updateSocialLink(social.id ?? 0, 'url', e.target.value); }}
                  placeholder="https://facebook.com/yourpage"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>{  removeSocialLink(social.id ?? 0); }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
