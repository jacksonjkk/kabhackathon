import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { LANGS, setLanguage, isDraft } from '../i18n'
import { useAuth } from '../context/AuthContext'

// Compact language picker. `variant` controls sizing for header vs settings use.
export default function LanguageSwitcher({ variant = 'header' }) {
  const { i18n, t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const draft = isDraft(i18n.language)
  const pick = code => {
    setLanguage(code)
    // Persist for logged-in users; never block the instant local switch.
    if (user) updateProfile({ language: code }).catch(() => {})
  }
  if (variant === 'settings') {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('settings.language')}</label>
        <p className="text-[11px] text-gray-500 mb-2">{t('settings.languageSub')}</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGS.map(l => {
            const active = i18n.language === l.code
            const needsReview = isDraft(l.code)
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => pick(l.code)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                  active ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-green-400'
                }`}
              >
                {l.label}
                {needsReview && <span className="block text-[10px] font-normal text-amber-600">*</span>}
              </button>
            )
          })}
        </div>
        {draft && <p className="text-[11px] text-amber-600 mt-2">* {t('settings.draftNote')}</p>}
      </div>
    )
  }
  const [open, setOpen] = useState(false)
  const choose = code => { pick(code); setOpen(false) }
  return (
    <>
      <div className="sm:hidden relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={t('settings.language')}
          aria-expanded={open}
          className="flex items-center gap-1 px-2 py-2 text-xs font-black text-gray-600 hover:text-green-700 transition-colors rounded-md hover:bg-green-50/50 cursor-pointer"
        >
          <Globe size={16} />
          {i18n.language.toUpperCase()}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[11rem] bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 overflow-hidden">
              {LANGS.map(l => {
                const active = i18n.language === l.code
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => choose(l.code)}
                    className={`flex items-center justify-between gap-3 w-full px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                      active ? 'bg-green-50 text-green-800' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{l.label}{isDraft(l.code) ? ' *' : ''}</span>
                    {active && <Check size={14} className="text-green-700 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
      <label className="hidden sm:flex items-center gap-1.5 px-2 py-2 text-sm text-gray-600 hover:text-green-700 transition-colors rounded-md hover:bg-green-50/50 cursor-pointer">
      <Globe size={16} />
      <select
        aria-label={t('settings.language')}
        value={i18n.language}
        onChange={e => pick(e.target.value)}
        className="bg-transparent text-xs font-semibold cursor-pointer focus:outline-none max-w-[86px]"
      >
        {LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.label}{isDraft(l.code) ? ' *' : ''}</option>
        ))}
      </select>
    </label>
    </>
  )
}
