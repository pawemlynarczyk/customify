#!/usr/bin/env node
/**
 * Pobiera CAŁY motyw ze Shopify (działająca wersja z backapu) do shopify-theme/customify-theme/
 * Użycie: node download-theme-full.js
 * Wymaga: SHOPIFY_ACCESS_TOKEN w .env
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHOP = 'customify-ok.myshopify.com';
const OUTPUT_DIR = path.join(__dirname, 'shopify-theme', 'customify-theme');

async function fetchAllAssets(themeId, accessToken) {
  const allAssets = [];
  let pageInfo = null;
  
  do {
    let url = `https://${SHOP}/admin/api/2023-10/themes/${themeId}/assets.json?limit=250`;
    if (pageInfo) url += `&page_info=${pageInfo}`;
    
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Assets API error: ${res.status} ${await res.text()}`);
    }
    
    const data = await res.json();
    const assets = data.assets || [];
    allAssets.push(...assets);
    
    // Paginacja - Link header lub next page_info
    const linkHeader = res.headers.get('Link');
    pageInfo = null;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/page_info=([^>]+)>;\s*rel="next"/);
      if (match) pageInfo = match[1].trim();
    }
    
    console.log(`   Pobrano stronę: ${assets.length} assets (łącznie: ${allAssets.length})`);
  } while (pageInfo);
  
  return allAssets;
}

async function main() {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w .env');
    process.exit(1);
  }

  console.log('🔍 Pobieranie listy theme...');
  
  const themesRes = await fetch(`https://${SHOP}/admin/api/2023-10/themes.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });

  const themesData = await themesRes.json();
  const mainTheme = themesData.themes?.find(t => t.role === 'main');
  if (!mainTheme) {
    console.error('❌ Nie znaleziono main theme');
    process.exit(1);
  }

  console.log(`🎯 Theme: ${mainTheme.name} (ID: ${mainTheme.id})\n`);
  console.log('📥 Pobieranie wszystkich assets (z paginacją)...');
  
  const assets = await fetchAllAssets(mainTheme.id, accessToken);
  console.log(`\n📁 Łącznie: ${assets.length} plików\n`);

  // Grupuj po typie (snippets, sections, layout, assets, etc.)
  const byType = {};
  for (const a of assets) {
    const parts = a.key.split('/');
    const type = parts[0] || 'other';
    if (!byType[type]) byType[type] = [];
    byType[type].push(a.key);
  }
  console.log('📂 Struktura na Shopify:');
  for (const [type, keys] of Object.entries(byType).sort()) {
    console.log(`   ${type}/: ${keys.length} plików`);
  }
  console.log('');

  let saved = 0;
  let skipped = 0;
  for (const asset of assets) {
    const destPath = path.join(OUTPUT_DIR, asset.key);
    const dir = path.dirname(destPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const value = asset.value ?? '';
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    if (isEmpty && asset.key.endsWith('.liquid')) {
      console.warn(`   ⚠️  Pusty: ${asset.key}`);
      skipped++;
    }

    fs.writeFileSync(destPath, value || '', 'utf8');
    saved++;
    if (saved % 50 === 0 || saved <= 20) {
      console.log(`   ✅ ${asset.key} (${value?.length || 0} znaków)`);
    }
  }

  console.log(`\n🎉 Zapisano ${saved} plików do ${OUTPUT_DIR}`);
  if (skipped) console.log(`   ⚠️  ${skipped} pustych plików liquid`);
}

main().catch(err => {
  console.error('❌', err);
  process.exit(1);
});
