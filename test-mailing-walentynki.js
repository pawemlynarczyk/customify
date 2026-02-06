// test-mailing-walentynki.js
// Prosty skrypt do testowania endpointów mailingowych bez vercel dev

const fetch = require('node-fetch');

const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://customify-s56o.vercel.app';

async function testCollectionProducts() {
  console.log('🧪 Test 1: Pobieranie produktów z kolekcji (ID: 672196395333)...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/get-collection-products?id=672196395333`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUKCES!');
      console.log(`   Kolekcja: ${data.collection.title} (${data.collection.handle})`);
      console.log(`   Produkty: ${data.count}`);
      if (data.products.length > 0) {
        console.log('\n   Przykładowe produkty:');
        data.products.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.title}`);
        });
      }
      return data.products;
    } else {
      console.log('❌ BŁĄD:', data.error || data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ BŁĄD:', error.message);
    return null;
  }
}

async function testSendEmail(testEmail) {
  console.log(`\n🧪 Test 2: Wysyłka testowego maila do ${testEmail}...\n`);
  
  if (!testEmail || !testEmail.includes('@')) {
    console.log('⚠️  Podaj prawidłowy email jako argument:');
    console.log('   node test-mailing-walentynki.js twoj@email.pl');
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/send-bulk-generation-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testEmail: testEmail,
        collectionId: '672196395333'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUKCES!');
      console.log(`   Email wysłany do: ${data.testEmail}`);
      console.log(`   Email ID: ${data.emailId || 'brak'}`);
      console.log(`   Sprawdź skrzynkę mailową (również folder SPAM)!`);
    } else {
      console.log('❌ BŁĄD:', data.error || data.message);
    }
  } catch (error) {
    console.log('❌ BŁĄD:', error.message);
  }
}

async function main() {
  console.log('🚀 Testowanie mailing walentynkowy\n');
  console.log(`📍 URL: ${BASE_URL}\n`);
  console.log('='.repeat(60) + '\n');
  
  // Test 1: Pobieranie produktów
  const products = await testCollectionProducts();
  
  // Test 2: Wysyłka maila (jeśli podano email)
  const testEmail = process.argv[2];
  if (testEmail) {
    await testSendEmail(testEmail);
  } else {
    console.log('\n💡 Aby przetestować wysyłkę maila, uruchom:');
    console.log(`   node test-mailing-walentynki.js twoj@email.pl`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Testy zakończone!');
}

main().catch(console.error);
