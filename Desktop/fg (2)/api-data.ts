import { PoolDataItem, OutputItem, FaqItem, Partner } from './types';

export const poolDataContent = (t: (key: string) => string): PoolDataItem[] => [
  { label: t('poolData.totalOutput'), value: '8,600,516.16', currency: 'BNB' },
  { label: t('poolData.validNodes'), value: '56,668.00' },
  { label: t('poolData.participants'), value: '78,087.00' },
  { label: t('poolData.userRevenue'), value: '1,896,683,446.79', currency: 'USDT' },
];

export const rawOutputDetails: OutputItem[] = [
    { address: '0x61fed5...4df26e', amount: '0.04601162 BNB' },
    { address: '0x4dffe5...2efa94', amount: '0.07244913 BNB' },
    { address: '0x8d40e2...6f3d44', amount: '0.04961785 BNB' },
    { address: '0x610af3...3d6483', amount: '0.05187965 BNB' },
    { address: '0xf4026e...27ce54', amount: '0.02986386 BNB' },
    { address: '0xf95205...eca9c0', amount: '0.01954117 BNB' },
    { address: '0x07f074...ac6fbc', amount: '0.05124554 BNB' },
    { address: '0x024e4f...79aac6', amount: '0.04329792 BNB' },
    { address: '0x14c011...0aa9b3', amount: '0.01163639 BNB' },
    { address: '0xae26a2...fcb50f', amount: '0.06284597 BNB' },
    { address: '0x5c4714...8d07f9', amount: '0.07233228 BNB' },
    { address: '0x200660...5aee86', amount: '0.0152396 BNB' },
    { address: '0x0da3ee...ff3540', amount: '0.00752982 BNB' },
    { address: '0x655e20...05fc51', amount: '0.07743383 BNB' },
    { address: '0x87fd56...6df32f', amount: '0.07763046 BNB' },
    { address: '0x30bf52...aa9bc3', amount: '0.01012457 BNB' },
];
export const outputDetailsContent: OutputItem[] = [...rawOutputDetails, ...rawOutputDetails];


export const faqDataContent = (t: (key: string) => string): FaqItem[] => [
  {
    question: t('faq.q1'),
    answer: t('faq.a1'),
  },
  {
    question: t('faq.q2'),
    answer: t('faq.a2'),
  },
  {
    question: t('faq.q3'),
    answer: t('faq.a3'),
  },
  {
    question: t('faq.q4'),
    answer: t('faq.a4'),
  },
  {
    question: t('faq.q5'),
    answer: t('faq.a5'),
  },
  {
    question: t('faq.q6'),
    answer: t('faq.a6'),
  },
  {
    question: t('faq.q7'),
    answer: t('faq.a7'),
  },
  {
    question: t('faq.q8'),
    answer: t('faq.a8'),
  },
];

export const partnersContent: Partner[] = [
    { name: 'Partner 1', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050116140.png' },
    { name: 'Partner 2', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050184226.png' },
    { name: 'Partner 3', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050161809.png' },
    { name: 'Partner 4', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050144921.png' },
    { name: 'Partner 5', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050170083.png' },
    { name: 'Partner 6', logo: 'https://a8m4u5.aibotbnb88.cc/upload/20250501/202505013660.png' },
];