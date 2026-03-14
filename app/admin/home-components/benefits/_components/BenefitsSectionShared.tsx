'use client';

import React from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { cn } from '../../../components/ui';
import type { BenefitsColorTokens } from '../_lib/colors';
import type { BenefitItem, BenefitsBrandMode, BenefitsConfig, BenefitsStyle } from '../_types';

interface BenefitsSectionSharedProps {
  items: BenefitItem[];
  style: BenefitsStyle;
  title?: string;
  config: Pick<BenefitsConfig, 'subHeading' | 'heading' | 'buttonText' | 'buttonLink'>;
  tokens: BenefitsColorTokens;
  mode: BenefitsBrandMode;
  context: 'preview' | 'site';
  maxVisible?: number;
}

const BENEFITS_FALLBACKS = {
  description: 'Mô tả lợi ích...',
  heading: 'Giá trị cốt lõi',
  subHeading: 'Vì sao chọn chúng tôi?',
  title: 'Lợi ích nổi bật',
};

const iconMap = {
  Check,
  Shield,
  Star,
  Target,
  Trophy,
  Zap,
} as const;

type IconName = keyof typeof iconMap;

const toIconName = (value?: string): IconName => {
  if (value && value in iconMap) {
    return value as IconName;
  }
  return 'Check';
};

const toText = (value: unknown, fallback: string) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : fallback;
};

const toSectionTitle = (title?: string, heading?: string) => {
  const headingText = toText(heading, '');
  if (headingText) {return headingText;}
  return toText(title, BENEFITS_FALLBACKS.title);
};

const toKeySeed = (item: BenefitItem, idx: number) => `${item.icon}|${item.title}|${item.description}|${idx}`;

const toStableKey = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

const buildStableKeys = (items: BenefitItem[]) => {
  const counters = new Map<string, number>();
  return items.map((item, idx) => {
    const seed = toKeySeed(item, idx);
    const base = toStableKey(seed);
    const seen = counters.get(base) ?? 0;
    counters.set(base, seen + 1);
    return `${base}-${seen}`;
  });
};

const sanitizeLink = (value?: string) => {
  const normalized = (value ?? '').trim();
  if (!normalized) {return '#';}

  if (
    normalized.startsWith('/')
    || normalized.startsWith('#')
    || normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('mailto:')
    || normalized.startsWith('tel:')
  ) {
    return normalized;
  }

  return '#';
};

const getRemainingCount = (allItems: BenefitItem[], displayedItems: BenefitItem[]) => (
  Math.max(0, allItems.length - displayedItems.length)
);

export function BenefitsSectionShared({
  items,
  style,
  title,
  config,
  tokens,
  mode,
  context,
  maxVisible,
}: BenefitsSectionSharedProps) {
  const HeadingTag = context === 'site' ? 'h2' : 'h3';

  const sectionHeading = toSectionTitle(title, config.heading ?? BENEFITS_FALLBACKS.heading);
  const sectionSubheading = toText(config.subHeading, BENEFITS_FALLBACKS.subHeading);
  const buttonText = (config.buttonText ?? '').trim();
  const buttonLink = sanitizeLink(config.buttonLink);

  const displayedItems = React.useMemo(
    () => (typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items),
    [items, maxVisible],
  );

  const remainingCount = getRemainingCount(items, displayedItems);

  const itemKeys = React.useMemo(
    () => buildStableKeys(displayedItems),
    [displayedItems],
  );

  const carouselId = React.useId().replaceAll(':', '');

  const renderHeader = () => (
    <div
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b"
      style={{ borderColor: tokens.neutralBorder }}
    >
      <div className="space-y-2">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: tokens.badgeBackground,
            borderColor: tokens.neutralBorder,
            color: tokens.badgeText,
          }}
        >
          {sectionSubheading}
        </span>
        <HeadingTag className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: tokens.heading }}>
          {sectionHeading}
        </HeadingTag>
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: tokens.iconSurfaceStrong }}
          >
            <Check size={32} style={{ color: tokens.iconTextStrong }} />
          </div>
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {toText(title, BENEFITS_FALLBACKS.title)}
          </HeadingTag>
          <p style={{ color: tokens.mutedText }}>Chưa có lợi ích nào</p>
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedItems.map((item, idx) => {
              const Icon = iconMap[toIconName(item.icon)];
              return (
                <article
                  key={itemKeys[idx]}
                  className="rounded-xl p-5 md:p-6 shadow-sm flex flex-col items-start border"
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <div
                    className="w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: tokens.iconSurfaceStrong, color: tokens.iconTextStrong }}
                  >
                    <Icon size={18} strokeWidth={2.6} />
                  </div>

                  <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2" style={{ color: tokens.heading }}>
                    {toText(item.title, 'Tiêu đề')}
                  </h3>

                  <p className="text-sm leading-relaxed line-clamp-3 min-h-[3.75rem]" style={{ color: tokens.mutedText }}>
                    {toText(item.description, BENEFITS_FALLBACKS.description)}
                  </p>
                </article>
              );
            })}

            {remainingCount > 0 && (
              <div
                className="rounded-xl flex items-center justify-center border-2 border-dashed p-5"
                style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralSurface }}
              >
                <div className="text-center">
                  <span className="text-lg font-bold" style={{ color: tokens.plusBadgeText }}>
                    +{remainingCount}
                  </span>
                  <p className="text-xs" style={{ color: tokens.mutedText }}>mục khác</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'list') {
    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-5xl mx-auto space-y-6">
          {renderHeader()}

          <div className="flex flex-col gap-3">
            {displayedItems.map((item, idx) => (
              <article
                key={itemKeys[idx]}
                className="relative rounded-lg p-4 md:p-5 pl-5 md:pl-6 overflow-hidden shadow-sm border"
                style={{
                  backgroundColor: tokens.neutralSurface,
                  borderColor: tokens.neutralBorder,
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-0 w-1.5"
                  style={{ backgroundColor: tokens.styleAccentByStyle.list }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center border"
                        style={{
                          backgroundColor: tokens.iconSurface,
                          borderColor: tokens.neutralBorder,
                          color: tokens.iconTextStrong,
                        }}
                      >
                        <span className="text-[11px] font-bold">{idx + 1}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm md:text-base line-clamp-1" style={{ color: tokens.neutralText }}>
                        {toText(item.title, 'Tiêu đề')}
                      </h3>
                      <p className="text-xs md:text-sm mt-1 md:mt-1.5 leading-normal line-clamp-2" style={{ color: tokens.mutedText }}>
                        {toText(item.description, BENEFITS_FALLBACKS.description)}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block flex-shrink-0" style={{ color: tokens.iconTextStrong }}>
                    <Check size={18} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {remainingCount > 0 && (
            <div className="text-center">
              <span className="text-sm font-medium" style={{ color: tokens.plusBadgeText }}>
                +{remainingCount} mục khác
              </span>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (style === 'bento') {
    const bentoItems = displayedItems.slice(0, 4);

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {bentoItems.map((item, idx) => {
              const isWide = idx === 0 || idx === 3;
              const isPrimary = idx === 0;

              return (
                <article
                  key={itemKeys[idx]}
                  className={cn(
                    'flex flex-col justify-between p-5 md:p-6 lg:p-8 rounded-2xl min-h-[160px] md:min-h-[180px] border',
                    isWide ? 'md:col-span-2' : 'md:col-span-1',
                  )}
                  style={
                    isPrimary
                      ? {
                        backgroundColor: tokens.primary,
                        borderColor: tokens.primary,
                      }
                      : {
                        backgroundColor: tokens.neutralSurface,
                        borderColor: tokens.neutralBorder,
                      }
                  }
                >
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded"
                      style={
                        isPrimary
                          ? {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                          }
                          : {
                            backgroundColor: tokens.badgeBackground,
                            color: tokens.badgeText,
                          }
                      }
                    >
                      0{idx + 1}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="font-bold text-lg md:text-xl lg:text-2xl mb-2 md:mb-3 tracking-tight line-clamp-2"
                      style={{ color: isPrimary ? '#ffffff' : tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    <p
                      className="text-sm md:text-base leading-relaxed font-medium line-clamp-3"
                      style={{ color: isPrimary ? 'rgba(255,255,255,0.9)' : tokens.mutedText }}
                    >
                      {toText(item.description, BENEFITS_FALLBACKS.description)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'row') {
    const rowItems = displayedItems.slice(0, 4);

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-8">
          {renderHeader()}

          <div className="rounded-lg overflow-hidden border-y" style={{ borderColor: tokens.rowDivider }}>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x"
              style={{ borderColor: tokens.rowDivider }}
            >
              {rowItems.map((item, idx) => {
                const Icon = iconMap[toIconName(item.icon)];

                return (
                  <article key={itemKeys[idx]} className="p-5 md:p-6 lg:p-8 flex flex-col items-center text-center" style={{ backgroundColor: tokens.neutralSurface }}>
                    <div
                      className="mb-3 md:mb-4 p-3 rounded-full"
                      style={{
                        backgroundColor: tokens.iconSurface,
                        color: tokens.iconText,
                        border: `1px solid ${tokens.neutralBorder}`,
                      }}
                    >
                      <Icon size={22} strokeWidth={2.6} />
                    </div>

                    <h3 className="font-bold mb-1.5 md:mb-2 text-sm md:text-base line-clamp-2 min-h-[2.5rem]" style={{ color: tokens.neutralText }}>
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    <p className="text-xs md:text-sm leading-relaxed line-clamp-3" style={{ color: tokens.mutedText }}>
                      {toText(item.description, BENEFITS_FALLBACKS.description)}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'carousel') {
    const cardWidth = 320;
    const gap = 16;
    const showArrowsDesktop = displayedItems.length > 3;

    return (
      <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">{renderHeader()}</div>

            {showArrowsDesktop && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#benefits-carousel-${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: -(cardWidth + gap) });}
                  }}
                  className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                  style={{ borderColor: tokens.carouselArrowBorder, color: tokens.carouselArrowIcon }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.querySelector<HTMLElement>(`#benefits-carousel-${carouselId}`);
                    if (container) {container.scrollBy({ behavior: 'smooth', left: cardWidth + gap });}
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl">
            <div className="absolute left-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-r from-white/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 md:w-6 bg-gradient-to-l from-white/40 to-transparent z-10 pointer-events-none" />

            <div
              id={`benefits-carousel-${carouselId}`}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 py-4 px-2 cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              onMouseDown={(event) => {
                const el = event.currentTarget;
                el.dataset.isDown = 'true';
                el.dataset.startX = String(event.pageX - el.offsetLeft);
                el.dataset.scrollLeft = String(el.scrollLeft);
                el.style.scrollBehavior = 'auto';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.dataset.isDown = 'false';
                event.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseUp={(event) => {
                event.currentTarget.dataset.isDown = 'false';
                event.currentTarget.style.scrollBehavior = 'smooth';
              }}
              onMouseMove={(event) => {
                const el = event.currentTarget;
                if (el.dataset.isDown !== 'true') {return;}
                event.preventDefault();
                const x = event.pageX - el.offsetLeft;
                const walk = (x - Number(el.dataset.startX)) * 1.5;
                el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
              }}
            >
              {displayedItems.map((item, idx) => {
                const Icon = iconMap[toIconName(item.icon)];
                const isHighlighted = mode === 'dual' ? idx % 3 === 0 : idx === 0;

                return (
                  <article
                    key={itemKeys[idx]}
                    className="snap-start w-[280px] md:w-[320px] flex-shrink-0 rounded-xl p-5 md:p-6 border shadow-sm"
                    style={
                      isHighlighted
                        ? {
                          backgroundColor: tokens.primary,
                          borderColor: tokens.primary,
                        }
                        : {
                          backgroundColor: tokens.neutralSurface,
                          borderColor: tokens.cardBorder,
                        }
                    }
                    draggable={false}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={
                        isHighlighted
                          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }
                          : { backgroundColor: tokens.iconSurfaceStrong, color: tokens.iconTextStrong }
                      }
                    >
                      <Icon size={18} strokeWidth={2.6} />
                    </div>

                    <h3
                      className="font-bold text-base mb-2 line-clamp-2"
                      style={{ color: isHighlighted ? '#ffffff' : tokens.neutralText }}
                    >
                      {toText(item.title, 'Tiêu đề')}
                    </h3>
                    <p
                      className="text-sm leading-relaxed line-clamp-3"
                      style={{ color: isHighlighted ? 'rgba(255,255,255,0.85)' : tokens.mutedText }}
                    >
                      {toText(item.description, BENEFITS_FALLBACKS.description)}
                    </p>
                  </article>
                );
              })}

              <div className="flex-shrink-0 w-4" />
            </div>

            <style>{`#benefits-carousel-${carouselId}::-webkit-scrollbar{display:none;}`}</style>
          </div>
        </div>
      </section>
    );
  }

  // timeline (default)
  return (
    <section className="py-12 md:py-16 px-4" style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="max-w-3xl mx-auto space-y-8">
        {renderHeader()}

        <div className="relative">
          <div
            className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5"
            style={{ backgroundColor: tokens.timelineLine }}
          />

          <div className="space-y-6 md:space-y-8">
            {displayedItems.map((item, idx) => (
              <article
                key={itemKeys[idx]}
                className={cn(
                  'relative flex items-start pl-12 md:pl-0',
                  idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse',
                )}
              >
                <div
                  className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold z-10"
                  style={{
                    backgroundColor: tokens.timelineDotBackground,
                    borderColor: tokens.timelineDotBorder,
                    color: tokens.timelineDotText,
                  }}
                >
                  {idx + 1}
                </div>

                <div
                  className="rounded-xl p-4 md:p-5 border shadow-sm w-full md:w-5/12"
                  style={{
                    backgroundColor: tokens.neutralSurface,
                    borderColor: tokens.cardBorder,
                  }}
                >
                  <h3 className="font-bold mb-2 line-clamp-2" style={{ color: tokens.neutralText }}>
                    {toText(item.title, 'Tiêu đề')}
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: tokens.mutedText }}>
                    {toText(item.description, BENEFITS_FALLBACKS.description)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {buttonText && (
          <div className="text-center">
            <a
              href={buttonLink}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: tokens.buttonBg, color: tokens.buttonText }}
            >
              {buttonText}
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
