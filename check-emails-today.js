// check-emails-today.js
// Sprawdza ile maili zostało wysłanych dzisiaj i 27.11.2025

const { execSync } = require('child_process');
const fs = require('fs');

console.log('📧 Sprawdzam maile z dzisiaj (27.11.2025)...\n');

try {
  // Pobierz logi z ostatnich 7 dni (żeby złapać 27.11)
  console.log('⏳ Pobieram logi z Vercel...');
  const logs = execSync('vercel logs customify-s56o.vercel.app --since 7d 2>&1', { 
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024 // 10MB
  });
  
  // Zapisz do pliku dla backupu
  fs.writeFileSync('/tmp/vercel-logs-backup.txt', logs);
  console.log('✅ Logi pobrane, analizuję...\n');
  
  const lines = logs.split('\n');
  
  // Statystyki
  const stats = {
    today: 0,
    nov27: 0,
    total: 0,
    emails: []
  };
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const nov27 = '2025-11-27';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Sprawdź czy to linia z datą 27.11.2025
    if (line.includes(nov27)) {
      // Sprawdź czy to email wysłany
      if (line.includes('Email wysłany pomyślnie') || line.includes('Resend ID')) {
        stats.nov27++;
        stats.total++;
        
        // Wyciągnij Resend ID jeśli jest
        const resendIdMatch = line.match(/Resend ID[:\s]+([^\s,]+)/);
        const emailMatch = line.match(/to[:\s]+([^\s,]+)/i) || line.match(/email[:\s]+([^\s,]+)/i);
        
        stats.emails.push({
          date: nov27,
          resendId: resendIdMatch ? resendIdMatch[1] : null,
          email: emailMatch ? emailMatch[1] : null,
          line: line.substring(0, 200)
        });
      }
    }
    
    // Sprawdź dzisiaj (jeśli dzisiaj to nie 27.11)
    if (today !== nov27 && line.includes(today)) {
      if (line.includes('Email wysłany pomyślnie') || line.includes('Resend ID')) {
        stats.today++;
        stats.total++;
      }
    }
  }
  
  // Wyświetl wyniki
  console.log('📊 WYNIKI:\n');
  console.log(`📅 Dzisiaj (${today}): ${stats.today} maili`);
  console.log(`📅 27.11.2025: ${stats.nov27} maili`);
  console.log(`📦 Łącznie: ${stats.total} maili\n`);
  
  if (stats.emails.length > 0) {
    console.log('📧 Szczegóły maili z 27.11.2025:\n');
    stats.emails.forEach((email, i) => {
      console.log(`${i + 1}. Resend ID: ${email.resendId || 'brak'}`);
      console.log(`   Email: ${email.email || 'brak'}`);
      console.log(`   Linia: ${email.line.substring(0, 100)}...\n`);
    });
  } else {
    console.log('⚠️  Nie znaleziono maili z 27.11.2025 w logach.');
    console.log('💡 Sprawdź czy:');
    console.log('   - Były generacje dzisiaj?');
    console.log('   - Maile są wysyłane (sprawdź RESEND_API_KEY)');
    console.log('   - Logi są dostępne w Vercel\n');
  }
  
  // Sprawdź też pominięte maile
  const skipped = lines.filter(l => l.includes('Pomijam email')).length;
  if (skipped > 0) {
    console.log(`⚠️  Pominięte maile: ${skipped}`);
  }
  
} catch (error) {
  console.error('❌ Błąd:', error.message);
  console.log('\n💡 Spróbuj ręcznie:');
  console.log('   vercel logs customify-s56o.vercel.app --since 7d | grep "2025-11-27" | grep "Email wysłany" | wc -l');
}



