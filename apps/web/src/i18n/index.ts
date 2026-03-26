/**
 * i18n facade – single point of change for i18n library.
 * Components import from here; swap the underlying lib (next-intl, react-i18next, etc.) in one place.
 */
export { NextIntlClientProvider, useLocale, useTranslations } from "next-intl";
