'use client';

import React from 'react';
import { DynamicFooter } from '@/components/site/DynamicFooter';
import { Header } from '@/components/site/Header';
import { CartDrawer } from '@/components/site/CartDrawer';
import { SiteProviders } from '@/components/site/SiteProviders';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteProviders>
      <div className="min-h-screen flex flex-col">
        <Header />
        <CartDrawer />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        <DynamicFooter />
      </div>
    </SiteProviders>
  );
}
