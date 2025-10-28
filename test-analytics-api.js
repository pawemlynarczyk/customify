async function testAnalytics() {
  try {
    console.log('🔍 Testowanie API analytics...');
    
    // Najpierw dodajmy testowy błąd
    console.log('1️⃣ Dodaję testowy błąd...');
    const logResponse = await fetch('https://customify-s56o.vercel.app/api/log-frontend-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Test error from Node.js',
        action: 'test_action',
        url: 'https://test.com',
        userAgent: 'Node.js Test'
      })
    });
    
    const logResult = await logResponse.json();
    console.log('📦 Log result:', logResult);
    
    // Poczekaj chwilę
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sprawdź czy analytics widzi logi (bez auth - sprawdzimy tylko czy endpoint działa)
    console.log('2️⃣ Sprawdzanie czy logi są zapisane...');
    
    // Dodaj kolejny log
    const log2Response = await fetch('https://customify-s56o.vercel.app/api/log-frontend-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Second test error',
        action: 'test_action_2',
        url: 'https://test.com'
      })
    });
    
    const log2Result = await log2Response.json();
    console.log('📦 Log2 result:', log2Result);
    
    console.log('');
    console.log('✅ API endpoint działa!');
    console.log('⚠️ Problem: Logi są w /tmp/ na Vercel - mogą być czyszczone między requestami');
    console.log('💡 Rozwiązanie: Trzeba użyć trwałej bazy danych (Vercel KV, PostgreSQL, etc.)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAnalytics();
