import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import sw from './locales/sw.json'
import lg from './locales/lg.json'
import nyn from './locales/nyn.json'

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'lg', label: 'Luganda' },
  { code: 'nyn', label: 'Runyankole' },
]

const stored = (() => {
  try {
    const v = localStorage.getItem('bovipulse_lang')
    return v && LANGS.some(l => l.code === v) ? v : 'en'
  } catch {
    return 'en'
  }
})()

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, sw: { translation: sw }, lg: { translation: lg }, nyn: { translation: nyn } },
  lng: stored,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(code) {
  if (!LANGS.some(l => l.code === code)) return
  try {
    localStorage.setItem('bovipulse_lang', code)
  } catch { /* private mode — session only */ }
  i18n.changeLanguage(code)
}

export function isDraft(code) {
  const ns = i18n.getResourceBundle(code, 'translation')
  return Boolean(ns?.meta?.draft)
}

export default i18n
