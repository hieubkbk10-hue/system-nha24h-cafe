'use client';

import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { FaqStyleTokens } from '../_lib/colors';
import type { FaqConfig, FaqItem, FaqStyle } from '../_types';

interface FaqSectionSharedProps {
  items: FaqItem[];
  title?: string;
  style: FaqStyle;
  config?: FaqConfig;
  tokens: FaqStyleTokens;
  context: 'preview' | 'site';
  maxVisible?: number;
}

const FAQ_FALLBACKS = {
  answer: 'Câu trả lời...',
  description: 'Tìm câu trả lời cho các thắc mắc phổ biến của bạn',
  question: 'Câu hỏi',
  title: 'Câu hỏi thường gặp',
};

const getValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export function FaqSectionShared({
  items,
  title,
  style,
  config,
  tokens,
  context,
  maxVisible,
}: FaqSectionSharedProps) {
  const HeadingTag = context === 'site' ? 'h2' : 'h3';
  const sectionTitle = getValue(title) ?? FAQ_FALLBACKS.title;

  const displayedItems = React.useMemo(
    () => (typeof maxVisible === 'number' ? items.slice(0, maxVisible) : items),
    [items, maxVisible],
  );
  const remainingCount = Math.max(0, items.length - displayedItems.length);

  const [openIndex, setOpenIndex] = React.useState<number | null>(displayedItems.length > 0 ? 0 : null);
  const [activeTab, setActiveTab] = React.useState(0);
  const accordionPrefix = React.useId().replaceAll(':', '');
  const tabPrefix = React.useId().replaceAll(':', '');

  React.useEffect(() => {
    if (displayedItems.length === 0) {
      setOpenIndex(null);
      setActiveTab(0);
      return;
    }

    setOpenIndex((current) => {
      if (current === null) {return 0;}
      if (current >= displayedItems.length) {return displayedItems.length - 1;}
      return current;
    });

    setActiveTab((current) => {
      if (current >= displayedItems.length) {return 0;}
      return current;
    });
  }, [displayedItems]);

  if (items.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: tokens.iconBg }}>
            <HelpCircle size={32} style={{ color: tokens.iconText }} />
          </div>
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>
          <p style={{ color: tokens.body }}>Chưa có câu hỏi nào</p>
        </div>
      </section>
    );
  }

  const renderRemainingBadge = () => {
    if (remainingCount <= 0) {return null;}

    return (
      <div className="flex items-center justify-center pt-2">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: tokens.badgeBg, color: tokens.number }}
        >
          +{remainingCount} câu hỏi khác
        </span>
      </div>
    );
  };

  if (style === 'accordion') {
    return (
      <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto">
          <HeadingTag className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>

          <div className="space-y-3" role="region" aria-label={sectionTitle}>
            {displayedItems.map((item, idx) => {
              const isOpen = openIndex === idx;
              const panelId = `${accordionPrefix}-panel-${idx}`;
              const buttonId = `${accordionPrefix}-button-${idx}`;
              const answer = getValue(item.answer) ?? FAQ_FALLBACKS.answer;
              const question = getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`;

              return (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden transition-colors"
                  style={{
                    backgroundColor: tokens.panelBg,
                    border: `1px solid ${isOpen ? tokens.panelBorderStrong : tokens.panelBorder}`,
                  }}
                >
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => { setOpenIndex(isOpen ? null : idx); }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setOpenIndex((current) => {
                          const next = current === null ? idx : current + 1;
                          return Math.min(next, displayedItems.length - 1);
                        });
                      }

                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setOpenIndex((current) => {
                          const next = current === null ? idx : current - 1;
                          return Math.max(next, 0);
                        });
                      }

                      if (event.key === 'Home') {
                        event.preventDefault();
                        setOpenIndex(0);
                      }

                      if (event.key === 'End') {
                        event.preventDefault();
                        setOpenIndex(displayedItems.length - 1);
                      }
                    }}
                    className={cn(
                      'w-full min-h-[44px] px-4 py-3 md:px-5 md:py-4 text-left flex items-center justify-between gap-3',
                      'focus-visible:outline-none focus-visible:ring-2',
                    )}
                    style={{ backgroundColor: isOpen ? tokens.panelBgMuted : tokens.panelBg, color: tokens.questionText }}
                  >
                    <span className="font-medium">{question}</span>
                    <ChevronDown
                      size={18}
                      className={cn('flex-shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                      style={{ color: tokens.chevron }}
                    />
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn('overflow-hidden transition-[max-height] duration-200', isOpen ? 'max-h-96' : 'max-h-0')}
                  >
                    <div
                      className="px-4 py-3 md:px-5 md:py-4 text-sm md:text-base leading-relaxed border-t"
                      style={{
                        backgroundColor: tokens.panelBgMuted,
                        borderColor: tokens.panelBorder,
                        color: tokens.body,
                      }}
                    >
                      {answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'cards') {
    return (
      <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-5xl mx-auto">
          <HeadingTag className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {displayedItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 md:p-5"
                style={{
                  backgroundColor: tokens.panelBg,
                  borderColor: tokens.panelBorder,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ backgroundColor: tokens.iconBg, color: tokens.iconText }}
                  >
                    ?
                  </div>
                  <div className="space-y-2 min-w-0">
                    <h4 className="font-semibold" style={{ color: tokens.panelTitleText }}>
                      {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: tokens.body }}>
                      {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'two-column') {
    const description = getValue(config?.description) ?? FAQ_FALLBACKS.description;
    const buttonText = getValue(config?.buttonText);
    const buttonLink = getValue(config?.buttonLink) ?? '#';

    return (
      <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-10">
          <div className="md:col-span-2">
            <HeadingTag className="text-2xl md:text-3xl font-bold mb-4" style={{ color: tokens.heading }}>
              {sectionTitle}
            </HeadingTag>
            <p className="leading-relaxed mb-6" style={{ color: tokens.body }}>
              {description}
            </p>

            {buttonText && (
              <a
                href={buttonLink}
                className="inline-flex min-h-[44px] items-center rounded-lg px-5 py-2.5 text-sm font-semibold"
                style={{
                  backgroundColor: tokens.ctaBg,
                  color: tokens.ctaText,
                  boxShadow: tokens.ctaShadow,
                }}
              >
                {buttonText}
              </a>
            )}
          </div>

          <div className="md:col-span-3 space-y-4 md:space-y-5">
            {displayedItems.map((item, idx) => (
              <div
                key={item.id}
                className="pb-4 border-b"
                style={{ borderColor: tokens.panelBorder }}
              >
                <h4 className="font-semibold mb-2" style={{ color: tokens.panelTitleText }}>
                  {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: tokens.body }}>
                  {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                </p>
              </div>
            ))}

            {renderRemainingBadge()}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return (
      <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto">
          <HeadingTag className="text-2xl md:text-3xl font-bold mb-8 md:mb-10" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>

          <div className="space-y-6 md:space-y-7">
            {displayedItems.map((item, idx) => (
              <div key={item.id} className="flex gap-4 md:gap-5">
                <span className="text-xl md:text-2xl font-bold flex-shrink-0" style={{ color: tokens.number }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="space-y-2">
                  <h4 className="font-semibold" style={{ color: tokens.panelTitleText }}>
                    {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                  </h4>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: tokens.body }}>
                    {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  if (style === 'timeline') {
    return (
      <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto">
          <HeadingTag className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ backgroundColor: tokens.timelineLine }} />

            <div className="space-y-5 md:space-y-6">
              {displayedItems.map((item, idx) => (
                <div key={item.id} className="relative pl-12 md:pl-14">
                  <div
                    className="absolute left-2.5 top-2 w-4 h-4 rounded-full border-4"
                    style={{
                      backgroundColor: tokens.timelineDotBg,
                      borderColor: tokens.timelineDotBorder,
                    }}
                  />

                  <div
                    className="rounded-xl border p-4 md:p-5"
                    style={{
                      backgroundColor: tokens.panelBgMuted,
                      borderColor: tokens.panelBorder,
                    }}
                  >
                    <h4 className="font-semibold mb-2" style={{ color: tokens.panelTitleText }}>
                      {getValue(item.question) ?? `${FAQ_FALLBACKS.question} ${idx + 1}`}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: tokens.body }}>
                      {getValue(item.answer) ?? FAQ_FALLBACKS.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {renderRemainingBadge()}
        </div>
      </section>
    );
  }

  const tabItems = displayedItems.slice(0, 6);

  if (tabItems.length === 0) {
    return (
      <section className="py-12 px-4" style={{ backgroundColor: tokens.sectionBg }}>
        <div className="max-w-3xl mx-auto text-center">
          <HeadingTag className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>
            {sectionTitle}
          </HeadingTag>
          <p style={{ color: tokens.body }}>Chưa có câu hỏi nào</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 px-4" style={{ backgroundColor: tokens.sectionBg }}>
      <div className="max-w-4xl mx-auto">
        <HeadingTag className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8" style={{ color: tokens.heading }}>
          {sectionTitle}
        </HeadingTag>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-2" role="tablist" aria-label={sectionTitle}>
          {tabItems.map((_, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={`${tabPrefix}-tab-${idx}`}
                id={`${tabPrefix}-tab-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tabPrefix}-panel-${idx}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => { setActiveTab(idx); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    setActiveTab((current) => (current + 1) % tabItems.length);
                  }

                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setActiveTab((current) => (current - 1 + tabItems.length) % tabItems.length);
                  }

                  if (event.key === 'Home') {
                    event.preventDefault();
                    setActiveTab(0);
                  }

                  if (event.key === 'End') {
                    event.preventDefault();
                    setActiveTab(tabItems.length - 1);
                  }
                }}
                className="min-h-[44px] rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border"
                style={
                  isActive
                    ? {
                      backgroundColor: tokens.tabActiveBg,
                      borderColor: tokens.tabActiveBg,
                      color: tokens.tabActiveText,
                    }
                    : {
                      backgroundColor: tokens.tabInactiveBg,
                      borderColor: tokens.panelBorder,
                      color: tokens.tabInactiveText,
                    }
                }
              >
                Q{idx + 1}
              </button>
            );
          })}

          {displayedItems.length > 6 && (
            <span className="px-3 py-2 text-sm flex items-center" style={{ color: tokens.tabOverflowText }}>+{displayedItems.length - 6}</span>
          )}
        </div>

        {tabItems[activeTab] && (
          <div
            id={`${tabPrefix}-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`${tabPrefix}-tab-${activeTab}`}
            className="rounded-xl border p-5 md:p-6"
            style={{
              backgroundColor: tokens.panelBg,
              borderColor: tokens.panelBorder,
            }}
          >
            <h4 className="text-lg md:text-xl font-semibold mb-3" style={{ color: tokens.panelTitleText }}>
              {getValue(tabItems[activeTab].question) ?? `${FAQ_FALLBACKS.question} ${activeTab + 1}`}
            </h4>
            <p className="leading-relaxed" style={{ color: tokens.body }}>
              {getValue(tabItems[activeTab].answer) ?? FAQ_FALLBACKS.answer}
            </p>
          </div>
        )}

        {renderRemainingBadge()}
      </div>
    </section>
  );
}
