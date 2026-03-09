#!/usr/bin/env node
/**
 * Skrypt do jednorazowego wgrania grafiki hero Dnia Kobiet na Vercel Blob.
 * Uruchom: node scripts/upload-hero-to-blob.js
 * Wymaga: BLOB_READ_WRITE_TOKEN lub customify_READ_WRITE_TOKEN w .env
 */

const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.customify_READ_WRITE_TOKEN;
  if (!token) {
    console.error('❌ Brak BLOB_READ_WRITE_TOKEN lub customify_READ_WRITE_TOKEN w .env');
    process.exit(1);
  }

  const imagePath = path.join(__dirname, '..', 'public', 'dzien-kobiet-hero.png');
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Plik nie istnieje:', imagePath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(imagePath);
  console.log('📤 Wgrywanie', (buffer.length / 1024).toFixed(1), 'KB...');

  const blob = await put('customify/mailing/dzien-kobiet-hero.png', buffer, {
    access: 'public',
    contentType: 'image/png',
    token
  });

  console.log('✅ Wgrano:', blob.url);
  console.log('\nZaktualizuj URL w api/send-bulk-generation-emails.js:');
  console.log('heroUrl =', JSON.stringify(blob.url));
}

main().catch(err => {
  console.error('❌ Błąd:', err.message);
  process.exit(1);
});
