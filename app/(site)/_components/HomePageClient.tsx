'use client';

import { ComponentRenderer } from '@/components/site/ComponentRenderer';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import React from 'react';

const EMPTY_COMPONENTS_COUNT = 0;

export default function HomePageClient({
  initialComponents,
}: {
  initialComponents?: Doc<'homeComponents'>[];
}): React.ReactElement {
  const components = useQuery(api.homeComponents.listActive);
  const resolvedComponents = components ?? initialComponents;

  if (typeof resolvedComponents === 'undefined') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (resolvedComponents.length === EMPTY_COMPONENTS_COUNT) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng!</h1>
          <p className="text-slate-500">
            Chưa có nội dung trang chủ. Vui lòng thêm components trong{' '}
            <a href="/admin/home-components" className="text-blue-600 hover:underline">
              Admin Panel
            </a>
          </p>
        </div>
      </div>
    );
  }

  const sortedComponents = [...resolvedComponents]
    .filter((componentItem) => componentItem.type !== 'Footer')
    .sort((firstComponent, secondComponent) => firstComponent.order - secondComponent.order);

  return (
    <>
      {sortedComponents.map((component) => (
        <ComponentRenderer
          key={component._id}
          component={{
            _id: component._id,
            active: component.active,
            config: component.config as Record<string, unknown>,
            order: component.order,
            title: component.title,
            type: component.type,
          }}
        />
      ))}
    </>
  );
}
