const fs = require('fs');

// Wczytaj CSV
const csvPath = '/Users/main/Downloads/customers_export.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Pomiń header
const customers = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // CSV może mieć cudzysłowy i przecinki - prosty parser
  const parts = line.split(',');
  if (parts.length < 4) continue;
  
  const customerId = parts[0]?.replace(/'/g, '').trim();
  const email = parts[3]?.trim();
  
  if (customerId && email && email.includes('@')) {
    customers.push({
      customerId: customerId,
      email: email.toLowerCase()
    });
  }
}

console.log(`📊 Znaleziono ${customers.length} klientów w CSV\n`);

// Sprawdź generacje przez API
async function checkGenerations() {
  console.log('🔍 Wysyłam request do API...\n');

  try {
    const response = await fetch('https://customify-s56o.vercel.app/api/check-customer-generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customers })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API returned error');
    }

    const results = data.results;

    // Podsumowanie
    console.log('\n' + '='.repeat(60));
    console.log('📊 PODSUMOWANIE:');
    console.log('='.repeat(60));
    console.log(`✅ Z generacjami: ${results.withGenerations.length}`);
    console.log(`❌ Bez generacji: ${results.withoutGenerations.length}`);
    console.log(`⚠️  Błędy: ${results.errors.length}`);
    console.log('='.repeat(60) + '\n');

    // Zapisz wyniki do plików
    fs.writeFileSync(
      'customers-with-generations.json',
      JSON.stringify(results.withGenerations, null, 2)
    );
    fs.writeFileSync(
      'customers-without-generations.json',
      JSON.stringify(results.withoutGenerations, null, 2)
    );

    console.log('💾 Zapisano wyniki:');
    console.log('   - customers-with-generations.json');
    console.log('   - customers-without-generations.json\n');

    // Pokaż przykłady z generacjami
    if (results.withGenerations.length > 0) {
      console.log('📧 Przykłady klientów Z generacjami:');
      results.withGenerations.slice(0, 10).forEach(c => {
        console.log(`   - ${c.email}: ${c.generationCount} generacji`);
      });
      if (results.withGenerations.length > 10) {
        console.log(`   ... i ${results.withGenerations.length - 10} więcej`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Błąd:', error);
    throw error;
  }
}

// Uruchom
checkGenerations().catch(error => {
  console.error('❌ Błąd:', error);
  process.exit(1);
});

