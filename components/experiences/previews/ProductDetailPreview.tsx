import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ChevronRight,
  CreditCard,
  Gift,
  Globe,
  Heart,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  ThumbsUp,
  Truck,
} from 'lucide-react';
import { CommentsPreview } from './DetailPreview';
import { getProductDetailColors } from '@/components/site/products/detail/_lib/colors';

type ProductDetailPreviewProps = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showRating: boolean;
  showComments?: boolean;
  showCommentLikes?: boolean;
  showCommentReplies?: boolean;
  showWishlist: boolean;
  showShare: boolean;
  showAddToCart: boolean;
  showBuyNow: boolean;
  showVariants?: boolean;
  showHighlights: boolean;
  classicHighlights?: { icon: string; text: string }[];
  heroStyle?: 'full' | 'split' | 'minimal';
  contentWidth?: 'narrow' | 'medium' | 'wide';
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
};

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const CLASSIC_HIGHLIGHT_ICON_MAP: Record<string, React.ElementType> = {
  Award,
  BadgeCheck,
  Bell,
  Bolt,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  Globe,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  Star,
  ThumbsUp,
  Truck,
};

const PREVIEW_IMAGES = [
  '/seed_mau/tech/products/1.webp',
  '/seed_mau/tech/products/2.webp',
  '/seed_mau/tech/products/3.webp',
];

const PREVIEW_DESCRIPTION = 'Thiết kế sang trọng, hiệu năng bền bỉ và trải nghiệm màn hình sắc nét phù hợp nhu cầu cao cấp. Pin tối ưu cho cả ngày dài, camera linh hoạt và chất liệu hoàn thiện tinh tế.';
const RATING_STAR_ACTIVE_COLOR = '#f59e0b';

function BlurredPreviewImage({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(24px)',
        }}
      />
      <div className="absolute inset-0 bg-black/10" />
      <img src={src} alt={alt} className="relative z-10 h-full w-full object-contain" />
    </>
  );
}

function ExpandablePreviewText({ text, className, style, buttonStyle }: { text: string; className?: string; style?: React.CSSProperties; buttonStyle?: React.CSSProperties }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    if (expanded) {
      return;
    }
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const checkOverflow = () => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${className ?? ''} ${expanded ? '' : 'line-clamp-4 md:line-clamp-5'}`.trim()}
        style={style}
      >
        {text}
      </div>
      {canExpand && (
        <button
          type="button"
          className="mt-2 text-sm font-medium"
          style={buttonStyle}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

function VariantPreview({ tokens }: { tokens: ReturnType<typeof getProductDetailColors> }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold" style={{ color: tokens.metaText }}>Màu sắc</p>
        <div className="flex gap-2 mt-2">
          {['#111827', '#e11d48', '#0ea5e9'].map((color, index) => (
            <span
              key={color}
              className="h-6 w-6 rounded-full border"
              style={{
                backgroundColor: color,
                borderColor: index === 0 ? tokens.variantRing : tokens.border,
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: tokens.metaText }}>Dung lượng</p>
        <div className="flex gap-2 mt-2">
          {['128GB', '256GB', '512GB'].map((value, index) => (
            <span
              key={value}
              className="px-3 py-1 rounded-full text-xs border"
              style={index === 1
                ? { backgroundColor: tokens.variantChipActiveBg, borderColor: tokens.variantChipActiveBorder, color: tokens.variantChipActiveText }
                : { borderColor: tokens.variantChipBorder, color: tokens.variantChipText }}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailPreview({
  layoutStyle,
  showRating,
  showComments,
  showCommentLikes,
  showCommentReplies,
  showWishlist,
  showShare,
  showAddToCart,
  showBuyNow,
  showVariants = true,
  showHighlights,
  classicHighlights = [],
  heroStyle = 'full',
  contentWidth = 'medium',
  device = 'desktop',
  brandColor = '#06b6d4',
  secondaryColor,
  colorMode = 'single',
}: ProductDetailPreviewProps) {
  const tokens = getProductDetailColors(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const productName = 'iPhone 15 Pro Max 256GB';
  const categoryName = 'Điện thoại';
  const sku = 'IP15PM-256';
  const stock = 12;
  const price = 34990000;
  const originalPrice = 36990000;
  const rating = 4.8;
  const reviews = 234;
  const hasRatingData = reviews > 0 && rating > 0;
  const discountPercent = Math.round((1 - price / originalPrice) * 100);
  const fallbackHighlights = [
    { icon: 'Star', text: 'Chip A17 Pro mạnh mẽ' },
    { icon: 'Star', text: 'Camera 48MP chuyên nghiệp' },
    { icon: 'Star', text: 'Titanium siêu bền' },
  ];
  const highlightItems = classicHighlights.length > 0 ? classicHighlights : fallbackHighlights;
  const showHighlightBlock = showHighlights && highlightItems.length > 0;
  const contentWidthClass = contentWidth === 'narrow'
    ? 'max-w-4xl'
    : contentWidth === 'wide'
      ? 'max-w-7xl'
      : 'max-w-6xl';
  const heroContainerClass = heroStyle === 'full'
    ? 'border rounded-2xl'
    : heroStyle === 'split'
      ? 'border rounded-2xl'
      : 'border rounded-xl';
  const heroContainerStyle = heroStyle === 'full'
    ? { borderColor: tokens.border, backgroundColor: tokens.surfaceMuted }
    : { borderColor: tokens.border, backgroundColor: tokens.surface };
  const heroImageWrapperClass = heroStyle === 'split'
    ? 'relative aspect-square flex items-center justify-center p-6'
    : heroStyle === 'minimal'
      ? 'relative aspect-square flex items-center justify-center p-3'
      : 'relative aspect-square flex items-center justify-center p-6';

  const renderHighlights = () => (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ backgroundColor: tokens.highlightBg }}>
      {highlightItems.map((item, index) => {
        const Icon = CLASSIC_HIGHLIGHT_ICON_MAP[item.icon] ?? Star;
        return (
          <div key={`${item.icon}-${index}`} className="text-center">
            <Icon size={24} className="mx-auto mb-2" style={{ color: tokens.highlightIcon }} />
            <p className="text-xs" style={{ color: tokens.highlightText }}>{item.text}</p>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="py-6 px-4 min-h-[300px]">
      <div className="max-w-6xl mx-auto">
        {layoutStyle === 'classic' && (
          <>
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-8'}`}>
            <div className="space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden" style={{ backgroundColor: tokens.surfaceMuted }}>
                {PREVIEW_IMAGES.length > 0 ? (
                  <BlurredPreviewImage src={PREVIEW_IMAGES[0]} alt={productName} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                  </div>
                )}
              </div>
              {PREVIEW_IMAGES.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {PREVIEW_IMAGES.slice(0, 4).map((img, index) => (
                    <div
                      key={img}
                      className="aspect-square rounded-lg border-2 overflow-hidden relative"
                      style={{
                        borderColor: index === 0 ? tokens.thumbnailBorderActive : tokens.thumbnailBorder,
                        backgroundColor: tokens.surfaceMuted,
                      }}
                    >
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: tokens.headingColor }}>{productName}</h1>
                {showRating && hasRatingData && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          style={i < Math.floor(rating)
                            ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                            : { color: tokens.ratingStarInactive }}
                        />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: tokens.ratingText }}>{rating} ({reviews} đánh giá)</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold" style={{ color: tokens.priceColor }}>{formatVND(price)}</span>
                <span className="text-lg line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(originalPrice)}</span>
                <span className="px-2 py-0.5 text-sm font-medium rounded" style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}>-{Math.round((1 - price / originalPrice) * 100)}%</span>
              </div>
              {showVariants && <VariantPreview tokens={tokens} />}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center border rounded-lg" style={{ borderColor: tokens.quantityBorder }}>
                  <button className="p-3" disabled>
                    <Minus size={18} style={{ color: tokens.quantityIconMuted }} />
                  </button>
                  <span className="w-12 text-center font-medium" style={{ color: tokens.quantityText }}>1</span>
                  <button className="p-3" disabled>
                    <Plus size={18} style={{ color: tokens.quantityIconMuted }} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {showAddToCart && (
                    <button className="py-3.5 px-8 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                      <ShoppingCart size={20} />
                      Thêm vào giỏ hàng
                    </button>
                  )}
                  {showBuyNow && (
                    <button className="py-3.5 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 border" style={{ borderColor: tokens.ctaSecondaryBorder, color: tokens.ctaSecondaryText }}>
                      Mua ngay
                    </button>
                  )}
                </div>

                {showWishlist && (
                  <button className="p-3.5 rounded-xl border" style={{ borderColor: tokens.wishlistBorder, backgroundColor: tokens.wishlistBg }}>
                    <Heart size={20} style={{ color: tokens.wishlistIcon }} />
                  </button>
                )}
                {showShare && (
                  <button className="p-3.5 rounded-xl border" style={{ borderColor: tokens.shareBorder, backgroundColor: tokens.shareBg }}>
                    <Share2 size={20} style={{ color: tokens.shareIcon }} />
                  </button>
                )}
              </div>

              {showHighlightBlock && renderHighlights()}
              <div className="border-t pt-6" style={{ borderColor: tokens.divider }}>
                <h3 className="font-semibold mb-4" style={{ color: tokens.headingColor }}>Mô tả sản phẩm</h3>
                <ExpandablePreviewText
                  text={PREVIEW_DESCRIPTION}
                  className="prose prose-sm max-w-none"
                  style={{ color: tokens.bodyText }}
                  buttonStyle={{ color: tokens.primary }}
                />
              </div>
            </div>
          </div>

          <CommentsPreview
            showComments={showComments}
            showLikes={showCommentLikes}
            showReplies={showCommentReplies}
            brandColor={brandColor}
          />
          </>
        )}

        {layoutStyle === 'modern' && (
          <div className="space-y-6">
            <header className="border-b pb-4" style={{ borderColor: tokens.divider }}>
              <div className="flex items-center justify-between gap-4 text-sm" style={{ color: tokens.breadcrumbText }}>
                <div className="flex items-center gap-2 truncate">
                  <span>Trang chủ</span>
                  <ChevronRight size={14} />
                  <span>Sản phẩm</span>
                  <ChevronRight size={14} />
                  <span className="truncate" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
                </div>
                {showWishlist && (
                  <button className="inline-flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Heart size={16} style={{ color: tokens.wishlistIcon }} />
                    Yêu thích
                  </button>
                )}
              </div>
            </header>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
              <div className="space-y-4">
                {heroStyle === 'split' ? (
                  <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                    <div className="grid md:grid-cols-2 gap-4 items-center p-4 md:p-6">
                      <div className="relative aspect-square rounded-xl overflow-hidden" style={{ backgroundColor: tokens.surfaceMuted }}>
                        {PREVIEW_IMAGES.length > 0 ? (
                          <BlurredPreviewImage src={PREVIEW_IMAGES[0]} alt={productName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                          </div>
                        )}
                      </div>
                      <div className="hidden md:flex flex-col gap-3 text-sm" style={{ color: tokens.metaText }}>
                        <span className="text-xs uppercase tracking-widest" style={{ color: tokens.softText }}>Điểm nổi bật</span>
                        <ul className="space-y-2">
                          <li>• Thiết kế cao cấp, hoàn thiện tinh tế</li>
                          <li>• Công nghệ mới nhất, hiệu năng ổn định</li>
                          <li>• Bảo hành chính hãng toàn quốc</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`overflow-hidden ${heroContainerClass}`} style={heroContainerStyle}>
                    <div className={`${heroImageWrapperClass} overflow-hidden`}>
                      {PREVIEW_IMAGES.length > 0 ? (
                        <BlurredPreviewImage src={PREVIEW_IMAGES[0]} alt={productName} />
                      ) : (
                        <div className="w-40 h-40 rounded-xl" style={{ backgroundColor: tokens.surfaceSoft }} />
                      )}
                    </div>
                  </div>
                )}

                {heroStyle !== 'minimal' && PREVIEW_IMAGES.length > 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {PREVIEW_IMAGES.slice(0, 3).map((img) => (
                      <div
                        key={img}
                        className="aspect-square rounded-xl border-2 overflow-hidden"
                        style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.thumbnailBorder }}
                      >
                        <img src={img} alt="" className="h-full w-full object-contain" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: tokens.categoryBadgeBg,
                      color: tokens.categoryBadgeText,
                      borderColor: tokens.categoryBadgeBorder,
                      borderWidth: 1,
                    }}
                  >
                    {categoryName}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-light tracking-tight" style={{ color: tokens.headingColor }}>{productName}</h1>

                {showRating && hasRatingData && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: tokens.ratingText }}>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          style={star <= Math.round(rating)
                            ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                            : { color: tokens.ratingStarInactive }}
                        />
                      ))}
                    </div>
                    <span>{rating} ({reviews})</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-light" style={{ color: tokens.priceColor }}>{formatVND(price)}</span>
                    <span className="text-lg line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(originalPrice)}</span>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: tokens.discountBadgeBg, color: tokens.discountBadgeText }}
                  >
                    Giảm {discountPercent}%
                  </span>
                </div>

                {showVariants && <VariantPreview tokens={tokens} />}

                <div className="h-px w-full" style={{ backgroundColor: tokens.divider }} />

                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: tokens.bodyText }}>Số lượng</label>
                  <div className="flex items-center gap-3">
                    <button type="button" className="h-10 w-10 border rounded-full flex items-center justify-center" style={{ borderColor: tokens.quantityBorder }}>
                      <Minus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                    </button>
                    <div className="w-16 text-center">
                      <span className="text-lg font-medium" style={{ color: tokens.quantityText }}>1</span>
                    </div>
                    <button type="button" className="h-10 w-10 border rounded-full flex items-center justify-center" style={{ borderColor: tokens.quantityBorder }}>
                      <Plus className="w-4 h-4" style={{ color: tokens.quantityIcon }} />
                    </button>
                  </div>
                </div>

                {(showAddToCart || showBuyNow || showWishlist) && (
                  <div className="space-y-3">
                    {showAddToCart && (
                      <button className="w-full h-12 text-base font-semibold" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                        <ShoppingBag className="w-5 h-5 mr-2 inline-block" />
                        Thêm vào giỏ hàng
                      </button>
                    )}
                    {showBuyNow && (
                      <button className="w-full h-12 text-base font-semibold border" style={{ borderColor: tokens.ctaSecondaryBorder, color: tokens.ctaSecondaryText }}>
                        Mua ngay
                      </button>
                    )}
                    {showWishlist && (
                      <button className="w-full h-12 text-base border" style={{ borderColor: tokens.wishlistBorder, color: tokens.metaText, backgroundColor: tokens.wishlistBg }}>
                        <Heart className="w-5 h-5 mr-2 inline-block" style={{ color: tokens.wishlistIcon }} />
                        Thêm vào yêu thích
                      </button>
                    )}
                  </div>
                )}

                {showHighlightBlock && renderHighlights()}

                <div className="border rounded-2xl p-5" style={{ borderColor: tokens.border }}>
                  <ExpandablePreviewText
                    text={PREVIEW_DESCRIPTION}
                    className="prose prose-sm max-w-none"
                    style={{ color: tokens.bodyText }}
                    buttonStyle={{ color: tokens.primary }}
                  />
                </div>

                <CommentsPreview
                  showComments={showComments}
                  showLikes={showCommentLikes}
                  showReplies={showCommentReplies}
                  brandColor={brandColor}
                />
              </div>
            </div>
          </div>
        )}

        {layoutStyle === 'minimal' && (
          <div className={`space-y-6 ${contentWidthClass} mx-auto`}>
            <div className="text-xs flex items-center gap-2" style={{ color: tokens.breadcrumbText }}>
              <span>Trang chủ</span>
              <ChevronRight size={12} />
              <span>Sản phẩm</span>
              <ChevronRight size={12} />
              <span className="truncate max-w-[160px]" style={{ color: tokens.breadcrumbActive }}>{productName}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
              <div className="lg:col-span-7">
                <div className="flex flex-col-reverse md:flex-row gap-4">
                {PREVIEW_IMAGES.length > 1 && (
                  <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0">
                    {PREVIEW_IMAGES.slice(0, 3).map((img) => (
                      <div
                        key={img}
                        className="relative aspect-square w-20 md:w-full overflow-hidden rounded-sm border"
                        style={{ backgroundColor: tokens.surfaceMuted, borderColor: tokens.thumbnailBorder }}
                      >
                        <img src={img} alt="" className="h-full w-full object-contain" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-1 relative aspect-[4/5] rounded-sm overflow-hidden" style={{ backgroundColor: tokens.surfaceMuted }}>
                  {PREVIEW_IMAGES.length > 0 ? (
                    <BlurredPreviewImage src={PREVIEW_IMAGES[0]} alt={productName} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-lg" style={{ backgroundColor: tokens.surfaceSoft }} />
                    </div>
                  )}
                </div>
                </div>
              </div>

              <div className="lg:col-span-5 px-0 md:px-2 py-6 lg:py-0 flex flex-col justify-center">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: tokens.headingColor }}>{productName}</h1>
                  {showRating && hasRatingData && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: tokens.ratingText }}>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            style={star <= Math.round(rating)
                              ? { color: RATING_STAR_ACTIVE_COLOR, fill: RATING_STAR_ACTIVE_COLOR }
                              : { color: tokens.ratingStarInactive }}
                          />
                        ))}
                      </div>
                      <span>{rating} ({reviews})</span>
                    </div>
                  )}
                  <p className="text-2xl font-light" style={{ color: tokens.priceColor }}>
                    {formatVND(price)}
                  </p>
                  <div className="mt-4">
                    {showVariants && <VariantPreview tokens={tokens} />}
                  </div>
                </div>

                {(showAddToCart || showBuyNow || showWishlist) && (
                  <div className="flex flex-col gap-3 mb-6 border-t pt-6" style={{ borderColor: tokens.divider }}>
                    <div className="flex gap-4">
                      {showAddToCart && (
                        <button className="flex-1 h-14 uppercase tracking-wider text-sm font-medium" style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}>
                          Thêm vào giỏ
                        </button>
                      )}
                      {showWishlist && (
                        <button className="w-14 h-14 border flex items-center justify-center" style={{ borderColor: tokens.wishlistBorder, backgroundColor: tokens.wishlistBg }}>
                          <Heart size={20} style={{ color: tokens.wishlistIcon }} />
                        </button>
                      )}
                    </div>
                    {showBuyNow && (
                      <button className="h-12 uppercase tracking-wider text-xs font-medium border" style={{ borderColor: tokens.ctaSecondaryBorder, color: tokens.ctaSecondaryText }}>
                        Mua ngay
                      </button>
                    )}
                  </div>
                )}

                {showHighlightBlock && renderHighlights()}

                <div className="space-y-4 text-sm font-light" style={{ color: tokens.metaText }}>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tokens.divider }}>
                    <span>SKU</span>
                    <span className="font-mono" style={{ color: tokens.bodyText }}>{sku}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tokens.divider }}>
                    <span>Tình trạng</span>
                    <span style={{ color: stock > 0 ? tokens.stockSuccessText : tokens.stockDangerText }}>
                      {stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border px-6 py-8" style={{ borderColor: tokens.border }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: tokens.headingColor }}>Mô tả sản phẩm</h2>
              <ExpandablePreviewText
                text={PREVIEW_DESCRIPTION}
                className="leading-relaxed"
                style={{ color: tokens.bodyText }}
                buttonStyle={{ color: tokens.primary }}
              />
            </div>

            <CommentsPreview
              showComments={showComments}
              showLikes={showCommentLikes}
              showReplies={showCommentReplies}
              brandColor={brandColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
