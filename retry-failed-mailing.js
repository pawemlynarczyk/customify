// retry-failed-mailing.js - Ponowna wysyłka tylko do adresów z błędami

const fs = require('fs');

const BASE_URL = 'https://customify-s56o.vercel.app';
const COLLECTION_ID = '672196395333';
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 5000;

async function main() {
  console.log('🔄 Retry - wysyłka do adresów z błędami\n');
  
  const results = JSON.parse(fs.readFileSync('mailing-results.json', 'utf-8'));
  const failed = results.failed || [];
  
  if (failed.length === 0) {
    console.log('✅ Brak adresów do ponowienia');
    return;
  }
  
  console.log(`📋 Adresy do ponowienia: ${failed.length}\n`);
  
  const customers = failed
    .filter(f => f.email && f.email.includes('@'))
    .map(f => ({ email: f.email, customerId: f.customerId }));
  
  const batches = [];
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    batches.push(customers.slice(i, i + BATCH_SIZE));
  }
  
  const retryResults = { sent: [], failed: [] };
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📧 Partia ${i + 1}/${batches.length} - ${batch.length} adresów...`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/send-bulk-generation-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customers: batch,
          collectionId: COLLECTION_ID
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const sent = data.results?.sent || data.sent || [];
      const batchFailed = data.results?.failed || data.failed || [];
      
      retryResults.sent.push(...sent);
      retryResults.failed.push(...batchFailed);
      
      console.log(`  ✅ Wysłano: ${sent.length}, Błędy: ${batchFailed.length}`);
      
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    } catch (error) {
      console.log(`  ❌ Błąd: ${error.message}`);
      batch.forEach(c => retryResults.failed.push({ ...c, error: error.message }));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('RAPORT RETRY:');
  console.log('='.repeat(50));
  console.log(`✅ Wysłano: ${retryResults.sent.length}`);
  console.log(`❌ Błędy: ${retryResults.failed.length}`);
  console.log('='.repeat(50));
  
  fs.writeFileSync('retry-results.json', JSON.stringify(retryResults, null, 2));
  console.log('\n💾 Wyniki: retry-results.json');
}

main().catch(console.error);
