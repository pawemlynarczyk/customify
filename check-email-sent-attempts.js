// check-email-sent-attempts.js
// Sprawdza logi Vercel - kto powinien dostać maila i czy został wysłany

const { execSync } = require('child_process');
const fs = require('fs');

async function checkEmailAttempts() {
  console.log('📧 Sprawdzam logi Vercel - kto powinien dostać maila...\n');
  
  try {
    // Pobierz logi z ostatnich 24h
    console.log('⏳ Pobieram logi z Vercel (ostatnie 24h)...');
    const logs = execSync('vercel logs customify-s56o.vercel.app --since 24h 2>&1', { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    // Zapisz do pliku
    fs.writeFileSync('/tmp/vercel-logs-email-check.txt', logs);
    console.log('✅ Logi pobrane, analizuję...\n');
    
    const lines = logs.split('\n');
    
    const results = {
      attempts: [], // Próby wysłania maila
      sent: [], // Maile wysłane (z Resend ID)
      failed: [], // Błędy wysyłania
      skipped: [] // Pominięte (brak warunków)
    };
    
    let currentAttempt = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Znajdź próbę wysłania maila
      if (line.includes('[SAVE-GENERATION] Wysyłam email przez Resend')) {
        currentAttempt = {
          timestamp: extractTimestamp(line),
          email: null,
          customerId: null,
          resendId: null,
          status: 'attempting',
          error: null
        };
      }
      
      // Wyciągnij email
      if (line.includes('[SAVE-GENERATION] email:') && currentAttempt) {
        const emailMatch = line.match(/email:\s*([^\s,]+)/);
        if (emailMatch) {
          currentAttempt.email = emailMatch[1];
        }
      }
      
      // Wyciągnij customerId
      if (line.includes('[SAVE-GENERATION] customerId:') && currentAttempt) {
        const customerIdMatch = line.match(/customerId:\s*([^\s,]+)/);
        if (customerIdMatch) {
          currentAttempt.customerId = customerIdMatch[1];
        }
      }
      
      // Sprawdź czy został wysłany (Resend ID)
      if (line.includes('[SAVE-GENERATION] Resend ID:') && currentAttempt) {
        const resendIdMatch = line.match(/Resend ID:\s*([^\s,]+)/);
        if (resendIdMatch) {
          currentAttempt.resendId = resendIdMatch[1];
          currentAttempt.status = 'sent';
          results.sent.push(currentAttempt);
          results.attempts.push(currentAttempt);
          currentAttempt = null;
        }
      }
      
      // Sprawdź błędy
      if (line.includes('[SAVE-GENERATION] Exception podczas wysyłania emaila') && currentAttempt) {
        currentAttempt.status = 'failed';
        // Pobierz komunikat błędu z następnej linii
        if (i + 1 < lines.length) {
          const errorLine = lines[i + 1];
          const errorMatch = errorLine.match(/Error message:\s*(.+)/);
          if (errorMatch) {
            currentAttempt.error = errorMatch[1];
          }
        }
        results.failed.push(currentAttempt);
        results.attempts.push(currentAttempt);
        currentAttempt = null;
      }
      
      // Sprawdź pominięte
      if (line.includes('Pomijam email -')) {
        const reasonMatch = line.match(/Pomijam email - (.+)/);
        if (reasonMatch && currentAttempt) {
          currentAttempt.status = 'skipped';
          currentAttempt.error = reasonMatch[1];
          results.skipped.push(currentAttempt);
          results.attempts.push(currentAttempt);
          currentAttempt = null;
        }
      }
    }
    
    // Wyświetl wyniki
    console.log('📊 WYNIKI ANALIZY LOGÓW:\n');
    console.log(`📧 Próby wysłania: ${results.attempts.length}`);
    console.log(`✅ Wysłane (z Resend ID): ${results.sent.length}`);
    console.log(`❌ Błędy: ${results.failed.length}`);
    console.log(`⚠️  Pominięte: ${results.skipped.length}\n`);
    
    if (results.sent.length > 0) {
      console.log('✅ MAILE WYSŁANE (z Resend ID):\n');
      results.sent.forEach((attempt, i) => {
        console.log(`${i + 1}. Email: ${attempt.email || 'BRAK'}`);
        console.log(`   CustomerId: ${attempt.customerId || 'BRAK'}`);
        console.log(`   Resend ID: ${attempt.resendId || 'BRAK'}`);
        console.log(`   Data: ${attempt.timestamp || 'BRAK'}\n`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('❌ BŁĘDY WYSYŁANIA:\n');
      results.failed.forEach((attempt, i) => {
        console.log(`${i + 1}. Email: ${attempt.email || 'BRAK'}`);
        console.log(`   CustomerId: ${attempt.customerId || 'BRAK'}`);
        console.log(`   Błąd: ${attempt.error || 'BRAK'}\n`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('⚠️  POMINIĘTE:\n');
      results.skipped.forEach((attempt, i) => {
        console.log(`${i + 1}. Email: ${attempt.email || 'BRAK'}`);
        console.log(`   CustomerId: ${attempt.customerId || 'BRAK'}`);
        console.log(`   Powód: ${attempt.error || 'BRAK'}\n`);
      });
    }
    
    // Zapisz wyniki
    const outputFile = 'email-attempts-results.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Wyniki zapisane do: ${outputFile}`);
    
    // Lista emaili do sprawdzenia w Resend
    if (results.sent.length > 0) {
      console.log('\n📋 LISTA EMAILI DO SPRAWDZENIA W RESEND:\n');
      const emails = results.sent.map(a => a.email).filter(e => e);
      const uniqueEmails = [...new Set(emails)];
      uniqueEmails.forEach((email, i) => {
        console.log(`${i + 1}. ${email}`);
      });
      
      console.log('\n📋 LISTA RESEND ID DO SPRAWDZENIA:\n');
      const resendIds = results.sent.map(a => a.resendId).filter(id => id);
      resendIds.forEach((id, i) => {
        console.log(`${i + 1}. ${id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    console.log('\n💡 Spróbuj ręcznie:');
    console.log('   vercel logs customify-s56o.vercel.app --since 24h | grep -E "Wysyłam email|Resend ID|Exception podczas wysyłania"');
  }
}

function extractTimestamp(line) {
  const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (timestampMatch) {
    return timestampMatch[1];
  }
  return null;
}

checkEmailAttempts();



