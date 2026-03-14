export interface BenefitPersistItem {
  icon: string;
  title: string;
  description: string;
}

export interface BenefitItem extends BenefitPersistItem {
  id: string;
}

export type BenefitsStyle = 'cards' | 'list' | 'bento' | 'row' | 'carousel' | 'timeline';
export type BenefitsBrandMode = 'single' | 'dual';
export type BenefitsHarmony = 'analogous' | 'complementary' | 'triadic';

export interface BenefitsConfig {
  items: BenefitPersistItem[];
  style: BenefitsStyle;
  subHeading?: string;
  heading?: string;
  buttonText?: string;
  buttonLink?: string;
  harmony?: BenefitsHarmony;
}

export interface BenefitsEditorState {
  items: BenefitItem[];
  style: BenefitsStyle;
  subHeading: string;
  heading: string;
  buttonText: string;
  buttonLink: string;
  harmony: BenefitsHarmony;
}

export interface BenefitsStyleOption {
  id: BenefitsStyle;
  label: string;
}
