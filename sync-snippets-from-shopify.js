#!/usr/bin/env node
/**
 * Pobiera snippety ze Shopify (z pełną zawartością) i zapisuje lokalnie.
 * Użycie: node sync-snippets-from-shopify.js
 * Wymaga: SHOPIFY_ACCESS_TOKEN w .env
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHOP = 'customify-ok.myshopify.com';
const SNIPPETS_DIR = path.join(__dirname, 'shopify-theme', 'customify-theme', 'snippets');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w .env');
    process.exit(1);
  }

  console.log('🔍 Pobieranie theme...');
  const themesRes = await fetch(`https://${SHOP}/admin/api/2023-10/themes.json`, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }
  });
  const themesData = await themesRes.json();
  if (themesData.errors) {
    console.error('❌', themesData.errors);
    process.exit(1);
  }
  const mainTheme = (themesData.themes || []).find(t => t.role === 'main') || (themesData.themes || [])[0];
  if (!mainTheme) {
    console.error('❌ Nie znaleziono theme');
    process.exit(1);
  }

  // Pobierz listę kluczy assetów (tylko klucze, bez value)
  console.log(`🎯 Theme: ${mainTheme.name}`);
  console.log('📥 Pobieranie listy snippetów...');
  const allKeys = [];
  let url = `https://${SHOP}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?limit=250`;
  while (url) {
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } });
    const d = await r.json();
    const assets = d.assets || [];
    assets.filter(a => a.key.startsWith('snippets/')).forEach(a => allKeys.push(a.key));
    const link = r.headers.get('Link');
    const m = link && link.match(/<([^>]+)>;\s*rel="next"/);
    url = m ? m[1] : null;
  }

  console.log(`📁 Znaleziono ${allKeys.length} snippetów na Shopify\n`);

  if (!fs.existsSync(SNIPPETS_DIR)) fs.mkdirSync(SNIPPETS_DIR, { recursive: true });

  let ok = 0;
  let empty = 0;
  for (const key of allKeys) {
    const res = await fetch(
      `https://${SHOP}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(key)}`,
      { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    const asset = data.asset;
    const content = asset?.value ?? '';
    const fileName = path.basename(key);
    const destPath = path.join(SNIPPETS_DIR, fileName);

    fs.writeFileSync(destPath, content, 'utf8');
    if (content.length > 0) {
      ok++;
      console.log(`  ✅ ${fileName} (${content.length} znaków)`);
    } else {
      empty++;
      console.log(`  ⚠️ ${fileName} (pusty)`);
    }
    await sleep(550); // ~2 req/s rate limit
  }

  console.log(`\n🎉 Zapisano ${ok} snippetów (${empty} pustych) do ${SNIPPETS_DIR}`);
}

main().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
