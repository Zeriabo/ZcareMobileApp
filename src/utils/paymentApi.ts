export const getPaymentApiBases = (rawBase: string): string[] => {
  const base = (rawBase || '').trim().replace(/\/+$/, '');
  const noV1 = base.endsWith('/v1') ? base.slice(0, -3) : base;

  return Array.from(
    new Set([
      base,
      noV1,
      `${noV1}/v1`,
      `${noV1}/api`,
      `${noV1}/api/v1`,
      `${noV1}/booking-service`,
      `${noV1}/booking-service/v1`,
    ].filter(Boolean))
  );
};

export const getSaveCardPaths = (): string[] => [
  '/payment/saved-cards/attach',
  '/payment/saved-cards',
  '/payment/save-card',
  '/payment/attach-payment-method',
  '/payment/saved-card/attach',
  '/payment/cards/save',
  '/payment/customer/payment-method',
];
