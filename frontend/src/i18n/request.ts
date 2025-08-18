import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'vi'];

export default getRequestConfig(async ({ locale }) => {
  // Fallback to 'en' if locale is undefined
  const validLocale = locale && locales.includes(locale) ? locale : 'en';
  
  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});
