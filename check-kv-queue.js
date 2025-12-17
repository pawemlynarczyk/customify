// check-kv-queue.js
// Sprawdza kolejkę limit-reached:* w Vercel KV

const { kv } = require('@vercel/kv');

async function checkQueue() {
  try {
    console.log('🔍 Sprawdzam kolejkę limit-reached w Vercel KV...\n');
    
    // Pobierz wszystkie klucze limit-reached:*
    const keys = await kv.keys('limit-reached:*');
    
    console.log(`📋 Znaleziono ${keys.length} wpisów w kolejce\n`);
    
    if (keys.length === 0) {
      console.log('✅ Kolejka jest pusta - brak użytkowników oczekujących na reset limitu\n');
      console.log('💡 Jeśli ktoś wyczerpał limit, wpis pojawi się tutaj automatycznie');
      return;
    }
    
    // Sprawdź każdy wpis
    for (const key of keys) {
      const customerId = key.replace('limit-reached:', '');
      const data = await kv.get(key);
      
      let payload;
      try {
        payload = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        payload = data;
      }
      
      const timestamp = payload?.timestamp;
      const totalUsed = payload?.totalUsed;
      const totalLimit = payload?.totalLimit;
      
      // Oblicz ile czasu minęło
      const now = Date.now();
      const createdAt = timestamp ? Date.parse(timestamp) : null;
      const elapsed = createdAt ? now - createdAt : null;
      const elapsedMinutes = elapsed ? Math.floor(elapsed / (1000 * 60)) : null;
      const elapsedHours = elapsed ? (elapsed / (1000 * 60 * 60)).toFixed(2) : null;
      
      // Sprawdź czy minęła już 1h (60 minut)
      const readyForReset = elapsedMinutes >= 60;
      
      console.log(`📌 Klucz: ${key}`);
      console.log(`   Customer ID: ${customerId}`);
      console.log(`   Timestamp: ${timestamp || 'BRAK'}`);
      console.log(`   Użyto: ${totalUsed}/${totalLimit}`);
      console.log(`   Czas od zapisu: ${elapsedMinutes ? `${elapsedMinutes} min (${elapsedHours}h)` : 'NIEZNANY'}`);
      console.log(`   Status: ${readyForReset ? '✅ GOTOWY DO RESETU (≥1h)' : '⏳ CZEKA (< 1h)'}`);
      console.log('');
    }
    
    // Podsumowanie
    const readyCount = keys.length; // Teoretycznie wszystkie które są w kolejce > 1h
    console.log('\n📊 PODSUMOWANIE:');
    console.log(`   Wszystkich wpisów: ${keys.length}`);
    console.log(`   Cron job: co 20 minut (/api/check-and-reset-limits)`);
    console.log(`   Następne sprawdzenie: za max 20 minut`);
    
  } catch (error) {
    console.error('❌ Błąd sprawdzania KV:', error);
    console.error('❌ Error message:', error.message);
    
    if (error.message.includes('KV_REST_API_URL')) {
      console.log('\n💡 Upewnij się że masz skonfigurowane Vercel KV environment variables:');
      console.log('   - KV_REST_API_URL');
      console.log('   - KV_REST_API_TOKEN');
    }
  }
}

checkQueue();
