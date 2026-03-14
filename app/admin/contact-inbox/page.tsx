'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Mail, Search } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'warning' | 'success' | 'destructive' | 'info' }> = {
  new: { label: 'Mới', variant: 'warning' },
  in_progress: { label: 'Đang xử lý', variant: 'info' },
  resolved: { label: 'Đã xử lý', variant: 'success' },
  spam: { label: 'Spam', variant: 'destructive' },
};

export default function ContactInboxPage() {
  return (
    <ModuleGuard moduleKey="contactInbox">
      <ContactInboxContent />
    </ModuleGuard>
  );
}

function ContactInboxContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'new' | 'in_progress' | 'resolved' | 'spam'>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const updateStatus = useMutation(api.contactInbox.updateInquiryStatus);
  const inboxAdminFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'contactInbox', featureKey: 'enableContactInboxAdmin' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => { clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus]);

  const offset = (currentPage - 1) * pageSize;
  const resolvedSearch = debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined;
  const shouldLoadInbox = inboxAdminFeature?.enabled === true;

  const inquiries = useQuery(
    api.contactInbox.listInbox,
    shouldLoadInbox
      ? {
        limit: pageSize,
        offset,
        search: resolvedSearch,
        status: filterStatus || undefined,
      }
      : 'skip'
  );

  const stats = useQuery(api.contactInbox.getInboxStats, shouldLoadInbox ? {} : 'skip');
  const isLoading = shouldLoadInbox && (inquiries === undefined || stats === undefined);
  const safeInquiries = inquiries ?? [];
  const safeStats = stats ?? { total: 0, new: 0, in_progress: 0, resolved: 0, spam: 0 };
  const totalItems = Math.max(safeStats.total, safeInquiries.length);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (inboxAdminFeature === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!inboxAdminFeature?.enabled) {
    return (
      <Card className="p-6 text-center text-slate-500">
        Tính năng quản trị inbox đang tắt. Hãy bật tại /system/modules/contactInbox.
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const handleStatusChange = async (id: Id<'contactInquiries'>, status: 'new' | 'in_progress' | 'resolved' | 'spam') => {
    await updateStatus({ id, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contact Inbox</h1>
          <p className="text-sm text-slate-500">Quản lý tin nhắn liên hệ từ website</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Tổng: {totalItems}</Badge>
          <Badge variant="warning">Mới: {safeStats.new}</Badge>
          <Badge variant="info">Đang xử lý: {safeStats.in_progress}</Badge>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <Input
              placeholder="Tìm theo tên, email, số điện thoại, chủ đề..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="new">Mới</option>
            <option value="in_progress">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách liên hệ</TableHead>
              <TableHead>Chủ đề</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Cập nhật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeInquiries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  Chưa có tin nhắn phù hợp.
                </TableCell>
              </TableRow>
            )}
            {safeInquiries.map((inquiry) => (
              <TableRow key={inquiry._id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      {inquiry.email && <span className="flex items-center gap-1"><Mail size={12} />{inquiry.email}</span>}
                      {inquiry.phone && <span>{inquiry.phone}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{inquiry.subject}</div>
                    <div className="text-xs text-slate-500 line-clamp-2" title={inquiry.message}>{inquiry.message}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_LABELS[inquiry.status]?.variant ?? 'secondary'}>
                    {STATUS_LABELS[inquiry.status]?.label ?? inquiry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {new Date(inquiry.createdAt).toLocaleString('vi-VN')}
                </TableCell>
                <TableCell className="text-right">
                  <select
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    value={inquiry.status}
                    onChange={(event) =>{ void handleStatusChange(inquiry._id, event.target.value as 'new' | 'in_progress' | 'resolved' | 'spam'); }}
                  >
                    <option value="new">Mới</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã xử lý</option>
                    <option value="spam">Spam</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Trang {currentPage} / {totalPages}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
