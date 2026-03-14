'use client';

import React from 'react';
import {
  Calendar,
  Facebook,
  Headphones,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingCart,
  Youtube,
} from 'lucide-react';
import { BrowserFrame } from '../../_shared/components/BrowserFrame';
import { ColorInfoPanel } from '../../_shared/components/ColorInfoPanel';
import { PreviewWrapper } from '../../_shared/components/PreviewWrapper';
import { deviceWidths, type PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import {
  getAPCATextColor,
  getSpeedDialColorTokens,
  normalizeSpeedDialActions,
  resolveActionBgColor,
  type SpeedDialColorTokens,
  type SpeedDialRenderableAction,
} from '../_lib/colors';
import { SPEED_DIAL_STYLES } from '../_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialBrandMode,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../_types';

type SpeedDialSectionContext = 'preview' | 'site';

interface SpeedDialSectionSharedProps {
  actions: SpeedDialAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  brandColor: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  sectionTitle: string;
  context: SpeedDialSectionContext;
  previewDevice?: PreviewDevice;
  setPreviewDevice?: (device: PreviewDevice) => void;
  includePreviewWrapper?: boolean;
  previewStyle?: SpeedDialStyle;
  onPreviewStyleChange?: (style: SpeedDialStyle) => void;
}

const getIconNode = (name: string, size = 18) => {
  const normalized = name.trim().toLowerCase();

  if (normalized === 'calendar') {return <Calendar size={size} />;}
  if (normalized === 'facebook') {return <Facebook size={size} />;}
  if (normalized === 'headphones') {return <Headphones size={size} />;}
  if (normalized === 'help-circle') {return <HelpCircle size={size} />;}
  if (normalized === 'instagram') {return <Instagram size={size} />;}
  if (normalized === 'mail') {return <Mail size={size} />;}
  if (normalized === 'map-pin') {return <MapPin size={size} />;}
  if (normalized === 'message-circle') {return <MessageCircle size={size} />;}
  if (normalized === 'shopping-cart') {return <ShoppingCart size={size} />;}
  if (normalized === 'youtube') {return <Youtube size={size} />;}
  if (normalized === 'zalo') {return <span className="text-[10px] font-bold leading-none">Zalo</span>;}

  return <Phone size={size} />;
};

const getLinkProps = (url: string) => {
  const href = url.trim().length > 0 ? url : '#';
  const isExternal = /^https?:\/\//i.test(href);

  return {
    href,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    target: isExternal ? '_blank' as const : undefined,
  };
};

const getStyleInfo = (
  style: SpeedDialStyle,
  actionCount: number,
  mode: SpeedDialBrandMode,
  context: SpeedDialSectionContext,
  previewDevice: PreviewDevice,
) => {
  const styleLabel = SPEED_DIAL_STYLES.find((item) => item.id === style)?.label ?? 'FAB';
  const countLabel = `${actionCount} action`;
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  const contextLabel = context === 'preview' ? previewDevice : 'site';
  return `${styleLabel} • ${countLabel} • ${modeLabel} • ${contextLabel}`;
};

const renderPageMock = (tokens: SpeedDialColorTokens) => (
  <div className="min-h-[440px] sm:min-h-[520px] rounded-xl border p-4 sm:p-5 relative overflow-hidden" style={{ backgroundColor: tokens.neutralBackground, borderColor: tokens.neutralBorder }}>
    <div className="space-y-3">
      <div className="h-6 w-44 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
      <div className="h-4 w-72 rounded" style={{ backgroundColor: tokens.pageMockLine }} />
    </div>

    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
      <div className="h-24 rounded-lg border" style={{ backgroundColor: tokens.pageMockCard, borderColor: tokens.neutralBorder }} />
    </div>

    <div
      className="absolute top-3 right-3 w-10 h-10 rounded-lg border flex items-center justify-center"
      style={{
        backgroundColor: tokens.plusTileBg,
        borderColor: tokens.neutralBorder,
        color: tokens.plusTileIcon,
      }}
      aria-hidden="true"
    >
      +
    </div>
  </div>
);

const renderFab = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed bottom-6 z-50 flex flex-col gap-3 ${isRight ? 'right-6 items-end' : 'left-6 items-start'}`
    : `absolute bottom-4 z-30 flex flex-col gap-2 ${isRight ? 'right-4 items-end' : 'left-4 items-start'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {actions.map((action) => {
        const bg = resolveActionBgColor(action.bgColor, tokens, 'fab');
        const text = getAPCATextColor(bg, 14, 600);

        return (
          <a key={action.key} {...getLinkProps(action.url)} className="group flex items-center gap-2" aria-label={action.label || action.icon}>
            {isRight && action.label && (
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap"
                style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
              >
                {action.label}
              </span>
            )}
            <span
              className="w-11 h-11 rounded-full shadow-sm flex items-center justify-center transition-colors border"
              style={{
                backgroundColor: bg,
                color: text,
                borderColor: tokens.actionStyleBorder.fab,
              }}
            >
              {getIconNode(action.icon, 18)}
            </span>
            {!isRight && action.label && (
              <span
                className="px-2.5 py-1 text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap"
                style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
              >
                {action.label}
              </span>
            )}
          </a>
        );
      })}

      <span
        className="w-12 h-12 rounded-full shadow-xl border flex items-center justify-center"
        style={{
          backgroundColor: tokens.mainButtonBg,
          color: tokens.mainButtonText,
          borderColor: tokens.mainButtonRing,
        }}
        aria-hidden="true"
      >
        +
      </span>
    </div>
  );
};

const renderSidebar = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed top-1/2 -translate-y-1/2 z-50 flex flex-col overflow-hidden shadow-xl ${isRight ? 'right-0 rounded-l-xl' : 'left-0 rounded-r-xl'}`
    : `absolute top-1/2 -translate-y-1/2 z-30 flex flex-col overflow-hidden shadow-xl ${isRight ? 'right-0 rounded-l-xl' : 'left-0 rounded-r-xl'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {actions.map((action, idx) => {
        const bg = resolveActionBgColor(action.bgColor, tokens, 'sidebar');
        const _text = getAPCATextColor(bg, 14, 600);

        return (
          <a
            key={action.key}
            {...getLinkProps(action.url)}
            className="group relative flex items-center justify-center w-11 h-11 text-sm font-medium hover:w-32 transition-all duration-200"
            style={{ backgroundColor: bg, color: tokens.actionStyleText.sidebar }}
            aria-label={action.label || action.icon}
          >
            <span className={`absolute ${isRight ? 'right-3' : 'left-3'}`}>{getIconNode(action.icon, 17)}</span>
            {action.label && <span className={`absolute text-xs opacity-0 group-hover:opacity-100 transition-opacity ${isRight ? 'right-10' : 'left-10'}`}>{action.label}</span>}
            {idx < actions.length - 1 && (
              <span
                className="absolute bottom-0 left-2 right-2 h-px"
                style={{ backgroundColor: tokens.separatorColor }}
                aria-hidden="true"
              />
            )}
          </a>
        );
      })}
    </div>
  );
};

const renderPills = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed bottom-6 z-50 flex flex-col gap-3 ${isRight ? 'right-6 items-end' : 'left-6 items-start'}`
    : `absolute bottom-4 z-30 flex flex-col gap-2 ${isRight ? 'right-4 items-end' : 'left-4 items-start'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      {actions.map((action) => {
        const bg = resolveActionBgColor(action.bgColor, tokens, 'pills');
        const _text = getAPCATextColor(bg, 14, 600);

        return (
          <a
            key={action.key}
            {...getLinkProps(action.url)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-colors border ${isRight ? 'flex-row' : 'flex-row-reverse'}`}
            style={{ 
              backgroundColor: bg, 
              color: tokens.actionStyleText.pills,
              borderColor: tokens.actionStyleBorder.pills,
            }}
            aria-label={action.label || action.icon}
          >
            {getIconNode(action.icon, 17)}
            {action.label && <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>}
          </a>
        );
      })}
    </div>
  );
};

const renderStack = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed bottom-6 z-50 ${isRight ? 'right-6' : 'left-6'}`
    : `absolute bottom-4 z-30 ${isRight ? 'right-4' : 'left-4'}`;

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      <div className="relative" style={{ height: `${Math.min(actions.length * 34 + 28, 190)}px`, width: '48px' }}>
        {actions.map((action, idx) => {
          const bg = resolveActionBgColor(action.bgColor, tokens, 'stack');
          const text = getAPCATextColor(bg, 14, 600);

          return (
            <a
              key={action.key}
              {...getLinkProps(action.url)}
              className="group absolute left-1/2 -translate-x-1/2 w-11 h-11 rounded-full shadow-sm flex items-center justify-center transition-colors border"
              style={{
                bottom: `${idx * 34}px`,
                zIndex: actions.length - idx,
                backgroundColor: bg,
                color: text,
                borderColor: tokens.actionStyleBorder.stack,
              }}
              aria-label={action.label || action.icon}
            >
              {getIconNode(action.icon, 17)}
              {action.label && (
                <span
                  className={`absolute px-2 py-1 text-[11px] rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isRight ? 'right-full mr-2' : 'left-full ml-2'}`}
                  style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
                >
                  {action.label}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

const renderDock = ({
  actions,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50'
    : 'absolute bottom-4 left-1/2 -translate-x-1/2 z-30';

  return (
    <div className={wrapperClass} role="group" aria-label={groupLabel}>
      <div
        className="flex items-end justify-center rounded-2xl p-2 gap-1.5 border"
        style={{
          backgroundColor: context === 'site' ? tokens.overlayScrim : tokens.dockBackdrop,
          borderColor: tokens.neutralBorder,
        }}
      >
        {actions.map((action) => {
          const bg = resolveActionBgColor(action.bgColor, tokens, 'dock');
          const text = getAPCATextColor(bg, 14, 600);

          return (
            <a
              key={action.key}
              {...getLinkProps(action.url)}
              className="group relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors border"
              style={{
                backgroundColor: bg,
                color: text,
                borderColor: tokens.actionStyleBorder.dock,
              }}
              aria-label={action.label || action.icon}
            >
              {getIconNode(action.icon, 16)}
              {action.label && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
                >
                  {action.label}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

const renderMinimal = ({
  actions,
  isRight,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  isRight: boolean;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const wrapperClass = context === 'site'
    ? `fixed bottom-6 z-50 flex items-center rounded-full px-2 py-1.5 gap-1.5 border shadow-sm ${isRight ? 'right-6' : 'left-6'}`
    : `absolute bottom-4 z-30 flex items-center rounded-full px-2 py-1.5 gap-1.5 border shadow-sm ${isRight ? 'right-4' : 'left-4'}`;

  return (
    <div
      className={wrapperClass}
      style={{
        backgroundColor: tokens.minimalBarBg,
        borderColor: tokens.neutralBorder,
      }}
      role="group"
      aria-label={groupLabel}
    >
      {actions.map((action, idx) => {
        const _baseColor = resolveActionBgColor(action.bgColor, tokens, 'minimal');

        return (
          <React.Fragment key={action.key}>
            <a
              {...getLinkProps(action.url)}
              className="group relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ color: tokens.minimalIconColor }}
              aria-label={action.label || action.icon}
            >
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: tokens.minimalHoverBg }}
                aria-hidden="true"
              />
              <span className="relative z-10">{getIconNode(action.icon, 16)}</span>
              {action.label && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-[11px] rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  style={{ backgroundColor: tokens.labelPillBg, color: tokens.labelPillText }}
                >
                  {action.label}
                </span>
              )}
            </a>
            {idx < actions.length - 1 && <span className="w-px h-5" style={{ backgroundColor: tokens.separatorColor }} aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const SpeedDialSectionContent = ({
  actions,
  style,
  position,
  tokens,
  context,
  groupLabel,
}: {
  actions: SpeedDialRenderableAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  tokens: SpeedDialColorTokens;
  context: SpeedDialSectionContext;
  groupLabel: string;
}) => {
  const isRight = position !== 'bottom-left';

  if (actions.length === 0) {
    return context === 'preview' ? renderPageMock(tokens) : null;
  }

  const floating = (
    <>
      {style === 'fab' && renderFab({ actions, isRight, tokens, context, groupLabel })}
      {style === 'sidebar' && renderSidebar({ actions, isRight, tokens, context, groupLabel })}
      {style === 'pills' && renderPills({ actions, isRight, tokens, context, groupLabel })}
      {style === 'stack' && renderStack({ actions, isRight, tokens, context, groupLabel })}
      {style === 'dock' && renderDock({ actions, tokens, context, groupLabel })}
      {style === 'minimal' && renderMinimal({ actions, isRight, tokens, context, groupLabel })}
    </>
  );

  if (context === 'site') {
    return floating;
  }

  return (
    <div className="relative">
      {renderPageMock(tokens)}
      {floating}
    </div>
  );
};

export function SpeedDialSectionShared({
  actions,
  style,
  position,
  brandColor,
  secondary,
  mode,
  sectionTitle,
  context,
  previewDevice = 'desktop',
  setPreviewDevice,
  includePreviewWrapper = false,
  previewStyle,
  onPreviewStyleChange,
}: SpeedDialSectionSharedProps) {
  const selectedStyle = previewStyle ?? style;
  const normalizedActions = React.useMemo(() => normalizeSpeedDialActions(actions), [actions]);
  const resolvedSectionTitle = sectionTitle.trim().length > 0 ? sectionTitle : 'Speed Dial';
  const tokens = React.useMemo(() => getSpeedDialColorTokens({
    primary: brandColor,
    secondary,
    mode,
  }), [brandColor, secondary, mode]);
  if (!includePreviewWrapper || context === 'site') {
    return (
      <SpeedDialSectionContent
        actions={normalizedActions}
        style={selectedStyle}
        position={position}
        tokens={tokens}
        context={context}
        groupLabel={resolvedSectionTitle}
      />
    );
  }

  const info = getStyleInfo(selectedStyle, normalizedActions.length, mode, context, previewDevice);

  return (
    <>
      <PreviewWrapper
        title="Preview Speed Dial"
        device={previewDevice}
        setDevice={(nextDevice) => { setPreviewDevice?.(nextDevice); }}
        previewStyle={selectedStyle}
        setPreviewStyle={(nextStyle) => { onPreviewStyleChange?.(nextStyle as SpeedDialStyle); }}
        styles={SPEED_DIAL_STYLES}
        info={info}
        deviceWidthClass={deviceWidths[previewDevice]}
      >
        <BrowserFrame>
          <SpeedDialSectionContent
            actions={normalizedActions}
            style={selectedStyle}
            position={position}
            tokens={tokens}
            context="preview"
            groupLabel={resolvedSectionTitle}
          />
        </BrowserFrame>
      </PreviewWrapper>

      {mode === 'dual' ? (
        <ColorInfoPanel
          brandColor={tokens.primary}
          secondary={tokens.secondary}
          description="Màu phụ được áp dụng cho action button, border ngăn cách và accent hover của Speed Dial."
        />
      ) : (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Màu chính:</span>
            <div
              className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm"
              style={{ backgroundColor: tokens.primary }}
              title={tokens.primary}
            />
            <span className="font-mono text-slate-600 dark:text-slate-400">{tokens.primary}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Chế độ 1 màu: các action Speed Dial tự động dùng monochromatic theo màu chính.
          </p>
        </div>
      )}
    </>
  );
}
