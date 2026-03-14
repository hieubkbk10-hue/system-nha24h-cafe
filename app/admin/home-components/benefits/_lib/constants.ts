import type { BenefitsConfig, BenefitsEditorState, BenefitsHarmony, BenefitsStyleOption } from '../_types';

export const DEFAULT_BENEFITS_HARMONY: BenefitsHarmony = 'analogous';

export const BENEFITS_STYLES: BenefitsStyleOption[] = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
  { id: 'bento', label: 'Bento' },
  { id: 'row', label: 'Row' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'timeline', label: 'Timeline' },
];

export const BENEFITS_HARMONY_OPTIONS: Array<{ value: BenefitsHarmony; label: string }> = [
  { value: 'analogous', label: 'Analogous (+30°)' },
  { value: 'complementary', label: 'Complementary (180°)' },
  { value: 'triadic', label: 'Triadic (120°)' },
];

export const DEFAULT_BENEFITS_CONFIG: BenefitsConfig = {
  buttonLink: '',
  buttonText: '',
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: 'Giá trị cốt lõi',
  items: [
    {
      description: '',
      icon: 'Star',
      title: '',
    },
  ],
  style: 'cards',
  subHeading: 'Vì sao chọn chúng tôi?',
};

export const DEFAULT_BENEFITS_EDITOR_STATE: BenefitsEditorState = {
  buttonLink: DEFAULT_BENEFITS_CONFIG.buttonLink ?? '',
  buttonText: DEFAULT_BENEFITS_CONFIG.buttonText ?? '',
  harmony: DEFAULT_BENEFITS_HARMONY,
  heading: DEFAULT_BENEFITS_CONFIG.heading ?? '',
  items: [
    {
      description: '',
      icon: 'Star',
      id: 'benefit-default-1',
      title: '',
    },
  ],
  style: DEFAULT_BENEFITS_CONFIG.style,
  subHeading: DEFAULT_BENEFITS_CONFIG.subHeading ?? '',
};
