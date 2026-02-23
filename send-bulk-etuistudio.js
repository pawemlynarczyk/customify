// send-bulk-etuistudio.js
// Masowa wysyłka maili etuistudio (z klienci-etuistudio.json)

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://customify-s56o.vercel.app';
const LIST_ARG = process.argv[2];
const LIST_FILE = path.join(__dirname, LIST_ARG || 'klienci-etuistudio.json');
const COLLECTION_HANDLE = 'walentynki';
const SUBJECT = 'Prezent na Walentynki? - Obraz ze zdjęcia w modnym stylu';
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 5000;

const baseName = path.basename(LIST_FILE, '.json').replace(/^klienci-/, '');
const PROGRESS_FILE = `mailing-${baseName}-progress.json`;
const RESULTS_FILE = `mailing-${baseName}-results.json`;

async function sendBatch(customers, batchNumber, totalBatches) {
  const valid = customers.filter(c => c.email && c.email.includes('@'));
  if (valid.length === 0) return { sent: [], failed: [] };

  const response = await fetch(`${BASE_URL}/api/send-bulk-generation-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customers: valid.map(c => ({ email: c.email, customerId: c.customerId || '' })),
      collectionHandle: COLLECTION_HANDLE,
      subject: SUBJECT
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'API error');

  return {
    sent: data.results?.sent || [],
    failed: data.results?.failed || []
  };
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch (e) {}
  }
  return { completedBatches: [], allResults: { sent: [], failed: [] } };
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}
function saveResults(r) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(r, null, 2));
}

async function main() {
  const list = JSON.parse(fs.readFileSync(LIST_FILE, 'utf-8'));
  const total = list.length;

  const batches = [];
  for (let i = 0; i < list.length; i += BATCH_SIZE) batches.push(list.slice(i, i + BATCH_SIZE));

  const progress = loadProgress();
  console.log('🚀 Mailing etuistudio');
  console.log(`📧 Łącznie: ${total} adresów, ${batches.length} partii po ${BATCH_SIZE}`);
  if (progress.completedBatches.length) {
    console.log(`📂 Wznowienie: ${progress.completedBatches.length} partii już wysłanych`);
  }
  console.log('');

  for (let i = 0; i < batches.length; i++) {
    const n = i + 1;
    if (progress.completedBatches.includes(n)) {
      console.log(`⏭️  Partia ${n}/${batches.length} – pomijam`);
      continue;
    }
    try {
      const res = await sendBatch(batches[i], n, batches.length);
      progress.completedBatches.push(n);
      progress.allResults.sent.push(...res.sent);
      progress.allResults.failed.push(...res.failed);
      saveProgress(progress);
      saveResults(progress.allResults);
      console.log(`✅ Partia ${n}/${batches.length}: ${res.sent.length} wysłano, ${res.failed.length} błędów`);
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    } catch (err) {
      console.error(`❌ Partia ${n}: ${err.message}`);
      saveProgress(progress);
      process.exit(1);
    }
  }

  console.log('');
  console.log('✅ KONIEC');
  console.log(`📧 Wysłano: ${progress.allResults.sent.length}`);
  console.log(`❌ Błędy: ${progress.allResults.failed.length}`);
  console.log(`💾 ${RESULTS_FILE}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
