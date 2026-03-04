// send-bulk-dzien-kobiet.js
// Masowa wysyłka maili z okazji Dnia Kobiet po 100 maili na raz

const fs = require('fs');

const BASE_URL = 'https://customify-s56o.vercel.app';
const COLLECTION_HANDLE = 'dzien-kobiet';
const BATCH_SIZE = 100; // Wysyłka po 100 maili
const MAX_EMAILS = 0; // Limit: wyślij tylko X maili (0 = bez limitu, 200 = test)
const DELAY_BETWEEN_EMAILS = 1000; // 1 sekunda między mailami (rate limiting)
const DELAY_BETWEEN_BATCHES = 5000; // 5 sekund przerwy między partiami

// Pliki do zapisu postępu (osobne od walentynkowego)
const PROGRESS_FILE = 'mailing-progress-dzien-kobiet.json';
const RESULTS_FILE = 'mailing-results-dzien-kobiet.json';

async function fetchOldCustomers() {
  console.log('📋 Pobieranie klientów starszych niż 2 tygodnie...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/get-old-customers?days=14`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch customers');
    }

    console.log(`✅ Znaleziono ${data.oldCustomers} klientów starszych niż 2 tygodnie`);
    console.log(`📊 Łącznie klientów w bazie: ${data.totalCustomers}\n`);

    return data.customers || [];
  } catch (error) {
    console.error('❌ Błąd pobierania klientów:', error.message);
    throw error;
  }
}

async function sendBatch(customers, batchNumber, totalBatches) {
  console.log(`\n📧 Partia ${batchNumber}/${totalBatches} - Wysyłka do ${customers.length} klientów...`);

  // Filtruj nieprawidłowe emaile
  const validCustomers = customers.filter(c => c.email && c.email.includes('@'));
  const invalidCustomers = customers.filter(c => !c.email || !c.email.includes('@'));

  if (invalidCustomers.length > 0) {
    console.log(`  ⚠️  Pominięto ${invalidCustomers.length} nieprawidłowych emaili`);
  }

  if (validCustomers.length === 0) {
    console.log(`  ⚠️  Brak prawidłowych emaili w partii`);
    return {
      sent: [],
      failed: invalidCustomers.map(c => ({
        email: c.email || 'brak',
        customerId: c.customerId,
        error: 'Invalid email'
      }))
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/send-bulk-generation-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customers: validCustomers.map(c => ({
          email: c.email,
          customerId: c.customerId
        })),
        collectionHandle: COLLECTION_HANDLE
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }

    const results = {
      sent: (data.results?.sent || data.sent || []).map(item => ({
        email: item.email,
        customerId: item.customerId,
        emailId: item.emailId
      })),
      failed: [
        ...(data.results?.failed || data.failed || []),
        ...invalidCustomers.map(c => ({
          email: c.email || 'brak',
          customerId: c.customerId,
          error: 'Invalid email'
        }))
      ]
    };

    const sentCount = results.sent.length;
    const failedCount = results.failed.length;
    console.log(`  ✅ Wysłano: ${sentCount}/${validCustomers.length}`);
    if (failedCount > 0) {
      console.log(`  ❌ Błędy: ${failedCount}`);
      results.failed.slice(0, 5).forEach(f => {
        console.log(`     - ${f.email}: ${f.error}`);
      });
      if (failedCount > 5) {
        console.log(`     ... i ${failedCount - 5} więcej`);
      }
    }

    console.log(`\n📊 Partia ${batchNumber}/${totalBatches} zakończona:`);
    console.log(`   ✅ Wysłano: ${sentCount}`);
    console.log(`   ❌ Błędy: ${failedCount}`);

    return results;
  } catch (error) {
    console.error(`\n❌ Błąd w partii ${batchNumber}:`, error.message);

    return {
      sent: [],
      failed: [
        ...validCustomers.map(c => ({
          email: c.email,
          customerId: c.customerId,
          error: error.message
        })),
        ...invalidCustomers.map(c => ({
          email: c.email || 'brak',
          customerId: c.customerId,
          error: 'Invalid email'
        }))
      ]
    };
  }
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      console.log(`📂 Wczytano postęp: ${data.completedBatches.length} partii już wysłanych\n`);
      return data;
    } catch (error) {
      console.log('⚠️  Nie można wczytać postępu, zaczynam od nowa\n');
    }
  }
  return {
    completedBatches: [],
    allResults: {
      sent: [],
      failed: []
    }
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function saveResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

async function main() {
  console.log('🚀 Masowa wysyłka maili z okazji Dnia Kobiet');
  console.log('='.repeat(60));
  console.log(`📦 Rozmiar partii: ${BATCH_SIZE} maili`);
  console.log(`⏱️  Opóźnienie między mailami: ${DELAY_BETWEEN_EMAILS}ms`);
  console.log(`⏸️  Przerwa między partiami: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log('='.repeat(60) + '\n');

  const progress = loadProgress();

  let allCustomers = [];
  try {
    allCustomers = await fetchOldCustomers();
  } catch (error) {
    console.error('❌ Nie można pobrać klientów:', error);
    process.exit(1);
  }

  if (allCustomers.length === 0) {
    console.log('⚠️  Brak klientów do wysłania');
    process.exit(0);
  }

  if (MAX_EMAILS > 0) {
    allCustomers = allCustomers.slice(0, MAX_EMAILS);
    console.log(`📌 Limit: wysyłka tylko ${MAX_EMAILS} maili\n`);
  }

  const batches = [];
  for (let i = 0; i < allCustomers.length; i += BATCH_SIZE) {
    batches.push(allCustomers.slice(i, i + BATCH_SIZE));
  }

  console.log(`\n📦 Przygotowano ${batches.length} partii po ${BATCH_SIZE} maili`);
  console.log(`📧 Łącznie do wysłania: ${allCustomers.length} maili\n`);

  if (progress.completedBatches.length > 0) {
    console.log(`⚠️  Wykryto wcześniejszą wysyłkę:`);
    console.log(`   Wysłane partie: ${progress.completedBatches.join(', ')}`);
    console.log(`   Pozostało: ${batches.length - progress.completedBatches.length} partii\n`);
  }

  for (let i = 0; i < batches.length; i++) {
    const batchNumber = i + 1;

    if (progress.completedBatches.includes(batchNumber)) {
      console.log(`\n⏭️  Partia ${batchNumber}/${batches.length} - już wysłana, pomijam`);
      continue;
    }

    try {
      const batchResults = await sendBatch(batches[i], batchNumber, batches.length);

      progress.completedBatches.push(batchNumber);
      progress.allResults.sent.push(...batchResults.sent);
      progress.allResults.failed.push(...batchResults.failed);

      saveProgress(progress);
      saveResults(progress.allResults);

      if (i < batches.length - 1) {
        console.log(`\n⏸️  Przerwa ${DELAY_BETWEEN_BATCHES}ms przed następną partią...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.error(`\n❌ Błąd w partii ${batchNumber}:`, error.message);
      console.log('💾 Postęp zapisany, możesz wznowić później');
      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ WYSYŁKA ZAKOŃCZONA!');
  console.log('='.repeat(60));
  console.log(`📧 Wysłano: ${progress.allResults.sent.length}`);
  console.log(`❌ Błędy: ${progress.allResults.failed.length}`);
  console.log(`📊 Łącznie: ${allCustomers.length}`);
  console.log('='.repeat(60));
  console.log(`\n💾 Wyniki zapisane w: ${RESULTS_FILE}`);
  console.log(`📂 Postęp zapisany w: ${PROGRESS_FILE}\n`);
}

process.on('SIGINT', () => {
  console.log('\n\n⚠️  Przerwano wysyłkę!');
  console.log('💾 Postęp zapisany, możesz wznowić później uruchamiając skrypt ponownie');
  process.exit(0);
});

main().catch(error => {
  console.error('\n❌ Błąd krytyczny:', error);
  process.exit(1);
});
