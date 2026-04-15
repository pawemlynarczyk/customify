// ============================================================
// SHOPIFY API VERSION — CENTRALNA KONFIGURACJA
// ============================================================
//
// STARA WERSJA (przed migracją 2026-04-15):
//   - Część plików używała: 2023-10  (wygasła 2024-10-01)
//   - Część plików używała: 2024-01  (wygasła 2025-01-01)
//
// NOWA WERSJA: 2025-10 (wspierana do 2026-10-01)
//
// ▸ SZYBKI ROLLBACK (bez deployu!):
//   Vercel Dashboard → Settings → Environment Variables
//   → dodaj SHOPIFY_API_VERSION = 2024-01  (lub 2023-10)
//   → Redeploy
//
// ▸ ROLLBACK PRZEZ KOD:
//   Zmień '2025-10' poniżej na starą wersję i push do GitHub.
//
// ============================================================

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

module.exports = { SHOPIFY_API_VERSION };
