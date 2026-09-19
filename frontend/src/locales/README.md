# BoviPulse UI languages

Operational (caretaker) screens are translated via `i18next`. Marketing pages stay
English for now.

## Languages

| Code | Language | Status |
|---|---|---|
| `en` | English | Source of truth |
| `sw` | Kiswahili | Full operational UI |
| `lg` | Luganda | **Draft**: needs native-speaker review |
| `nyn` | Runyankole (Kabale) | **Draft**: needs native-speaker review |

Draft languages are marked with `*` in the picker and a review note in Settings.
Never present a draft language as reviewed in the report. Say "community review pending".

## Files

- `en.json`: add every new UI string here first (same key tree).
- `sw.json`: full Swahili mirror of `en.json`.
- `lg.json`, `nyn.json`: core caretaker strings; fall back to English per-key via i18next `fallbackLng` for anything missing (missing keys render English, never blank).
- `../i18n.js`: loader, `bovipulse_lang` persistence, `LANGS` registry.

## Rules

1. **Keys, never sentences, in components.** Use `t('cow.logTitle')`, never inline text, on every new operational screen.
2. **Sign chips are data.** `cow.signs` arrays feed both the UI and the backend guard — see rule 4.
3. **Severity/status codes stay English internally** (`severity.Mild` etc. map display text; state values like `'Moderate'` are unchanged).
4. **Backend keyword sync (critical).** `backend/src/controllers/thermal.controller.js`
   matches caretaker notes by substring (`hasSickSign` / `hasHeatSign`). If you
   change or add a sign chip in ANY language, add its distinctive lowercase token
   to the matching list in the same commit. Avoid generic words that appear in
   temperature notes (e.g. never match bare `joto`).
5. **Alert titles** ship from the backend in English with fixed prefixes and are
   mapped client-side (`translateAlertTitle` in `../utils/explain.js`). If the
   backend adds a new alert class, add its prefix mapping + `alertTypes.*` keys.
6. **Review workflow for lg/nyn:** a native speaker edits only the `*.json`
   files (no code), then the `meta.draft` flag flips to `false` and the `*`
   disappears from the picker automatically.
