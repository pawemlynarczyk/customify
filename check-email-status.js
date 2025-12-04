// check-email-status.js
// Skrypt do sprawdzania statusu wysyłania maili po generacji

const https = require('https');

/**
 * Pobiera logi z Vercel dla endpointu save-generation
 * Sprawdza czy maile były wysyłane dla wszystkich generacji
 */
async function checkEmailStatus() {
  console.log('🔍 Sprawdzam status wysyłania maili...\n');
  
  // Instrukcje dla użytkownika
  console.log('📋 INSTRUKCJA:');
  console.log('1. Uruchom komendę: vercel logs customify-s56o.vercel.app --since 24h | grep -E "SAVE-GENERATION|📧|✅.*Email|❌.*Email" > email-logs.txt');
  console.log('2. Następnie uruchom: node check-email-status.js email-logs.txt\n');
  
  // Sprawdź czy plik z logami został podany
  const logFile = process.argv[2];
  
  if (!logFile) {
    console.log('⚠️  Użycie: node check-email-status.js <plik-z-logami>');
    console.log('   Przykład: node check-email-status.js email-logs.txt');
    return;
  }
  
  const fs = require('fs');
  
  if (!fs.existsSync(logFile)) {
    console.error(`❌ Plik ${logFile} nie istnieje!`);
    return;
  }
  
  const logs = fs.readFileSync(logFile, 'utf-8');
  const lines = logs.split('\n');
  
  // Analiza logów
  const results = {
    totalGenerations: 0,
    emailsSent: 0,
    emailsFailed: 0,
    missingEmail: 0,
    missingCustomerId: 0,
    missingImageUrl: 0,
    missingResendKey: 0,
    generations: []
  };
  
  let currentGeneration = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Znajdź nową generację (zapytanie do save-generation)
    if (line.includes('[SAVE-GENERATION] API called')) {
      if (currentGeneration) {
        results.generations.push(currentGeneration);
      }
      currentGeneration = {
        timestamp: extractTimestamp(line),
        email: null,
        customerId: null,
        emailSent: false,
        emailFailed: false,
        reason: null
      };
      results.totalGenerations++;
    }
    
    // Wyciągnij email
    if (line.includes('[SAVE-GENERATION] email:')) {
      const emailMatch = line.match(/email:\s*([^\s,]+)/);
      if (emailMatch && currentGeneration) {
        currentGeneration.email = emailMatch[1];
      }
    }
    
    // Wyciągnij customerId
    if (line.includes('[SAVE-GENERATION] customerId:')) {
      const customerIdMatch = line.match(/customerId:\s*([^\s,]+)/);
      if (customerIdMatch && currentGeneration) {
        currentGeneration.customerId = customerIdMatch[1];
      }
    }
    
    // Sprawdź warunki wysyłania
    if (line.includes('[SAVE-GENERATION] Warunek (customerId && email && imageUrlForEmail && token):')) {
      const conditionMatch = line.match(/token\):\s*(true|false)/);
      if (conditionMatch && currentGeneration) {
        const conditionMet = conditionMatch[1] === 'true';
        if (!conditionMet) {
          currentGeneration.reason = 'Warunki nie spełnione';
        }
      }
    }
    
    // Sprawdź czy email został wysłany
    if (line.includes('[SAVE-GENERATION] Email wysłany pomyślnie!')) {
      if (currentGeneration) {
        currentGeneration.emailSent = true;
        results.emailsSent++;
      }
    }
    
    // Sprawdź czy email się nie udał
    if (line.includes('[SAVE-GENERATION] Exception podczas wysyłania emaila:') || 
        line.includes('[SAVE-GENERATION] Error message:')) {
      if (currentGeneration) {
        currentGeneration.emailFailed = true;
        results.emailsFailed++;
        const errorMatch = line.match(/Error message:\s*(.+)/);
        if (errorMatch) {
          currentGeneration.reason = errorMatch[1];
        }
      }
    }
    
    // Sprawdź powody pominięcia
    if (line.includes('Pomijam email - brak emaila')) {
      results.missingEmail++;
      if (currentGeneration) {
        currentGeneration.reason = 'Brak emaila';
      }
    }
    if (line.includes('Pomijam email - brak customerId')) {
      results.missingCustomerId++;
      if (currentGeneration) {
        currentGeneration.reason = 'Brak customerId (niezalogowany)';
      }
    }
    if (line.includes('Pomijam email - brak watermarkedImageUrl')) {
      results.missingImageUrl++;
      if (currentGeneration) {
        currentGeneration.reason = 'Brak watermarkedImageUrl';
      }
    }
    if (line.includes('RESEND_API_KEY nie skonfigurowany')) {
      results.missingResendKey++;
      if (currentGeneration) {
        currentGeneration.reason = 'Brak RESEND_API_KEY';
      }
    }
  }
  
  // Dodaj ostatnią generację
  if (currentGeneration) {
    results.generations.push(currentGeneration);
  }
  
  // Wyświetl wyniki
  console.log('\n📊 WYNIKI ANALIZY:\n');
  console.log(`📦 Łącznie generacji: ${results.totalGenerations}`);
  console.log(`✅ Maile wysłane: ${results.emailsSent}`);
  console.log(`❌ Maile nieudane: ${results.emailsFailed}`);
  console.log(`⚠️  Brak emaila: ${results.missingEmail}`);
  console.log(`⚠️  Brak customerId: ${results.missingCustomerId}`);
  console.log(`⚠️  Brak watermarkedImageUrl: ${results.missingImageUrl}`);
  console.log(`⚠️  Brak RESEND_API_KEY: ${results.missingResendKey}`);
  
  const notSent = results.totalGenerations - results.emailsSent - results.missingEmail - results.missingCustomerId;
  console.log(`\n❓ Generacje bez maila (nieznany powód): ${notSent}`);
  
  // Szczegóły generacji bez maila
  const withoutEmail = results.generations.filter(g => !g.emailSent && !g.reason?.includes('niezalogowany'));
  
  if (withoutEmail.length > 0) {
    console.log('\n🔍 GENERACJE BEZ MAILA (szczegóły):\n');
    withoutEmail.forEach((gen, index) => {
      console.log(`${index + 1}. ${gen.timestamp || 'Brak timestamp'}`);
      console.log(`   Email: ${gen.email || 'BRAK'}`);
      console.log(`   CustomerId: ${gen.customerId || 'BRAK'}`);
      console.log(`   Powód: ${gen.reason || 'Nieznany'}`);
      console.log('');
    });
  }
  
  // Zapisz wyniki do pliku
  const outputFile = 'email-status-results.json';
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Wyniki zapisane do: ${outputFile}`);
}

function extractTimestamp(line) {
  // Próbuj wyciągnąć timestamp z logu
  const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (timestampMatch) {
    return timestampMatch[1];
  }
  return null;
}

// Uruchom analizę
checkEmailStatus().catch(console.error);



