import { languageOptions, useLanguageStore, type AppLanguage } from '../../features/settings/languageStore'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  return (
    <label className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
      {!compact ? <span>Language</span> : null}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="bg-transparent text-xs font-black text-slate-900 outline-none dark:text-white"
        aria-label="Language"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {compact ? option.code.toUpperCase() : `${option.nativeLabel}`}
          </option>
        ))}
      </select>
    </label>
  )
}
