// check-resend-now.js
// Sprawdza maile BEZPOŚREDNIO przez Resend API

require('dotenv').config();
const { Resend } = require('resend');

async function checkNow() {
  // Pobierz klucz z env lub z argumentu
  const apiKey = process.env.RESEND_API_KEY || process.argv[2];
  
  if (!apiKey) {
    console.log('❌ Brak RESEND_API_KEY!');
    console.log('💡 Użyj: RESEND_API_KEY=re_... node check-resend-now.js');
    console.log('💡 LUB: node check-resend-now.js re_...');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  
  try {
    console.log('📧 Sprawdzam maile w Resend API...\n');
    
    // Pobierz WSZYSTKIE maile (limit 1000)
    let allEmails = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 10) { // Max 10 stron = 1000 maili
      console.log(`⏳ Pobieram stronę ${page}...`);
      const response = await resend.emails.list({
        limit: 100,
        page: page
      });
      
      if (response.error) {
        console.error('❌ Błąd Resend API:', response.error);
        break;
      }
      
      const emails = response.data?.data || [];
      if (emails.length === 0) {
        hasMore = false;
      } else {
        allEmails = allEmails.concat(emails);
        page++;
      }
    }
    
    console.log(`✅ Pobrano ${allEmails.length} maili\n`);
    
    // Filtruj maile z 27.11.2025
    const nov27 = allEmails.filter(email => {
      if (!email.created_at) return false;
      const date = new Date(email.created_at);
      return date.toISOString().startsWith('2025-11-27');
    });
    
    // Filtruj tylko maile z generacji AI
    const nov27Generation = nov27.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    // Filtruj dzisiaj
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEmails = allEmails.filter(email => {
      if (!email.created_at) return false;
      const date = new Date(email.created_at);
      return date.toISOString().startsWith(todayStr);
    });
    
    const todayGeneration = todayEmails.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    // WYNIKI
    console.log('📊 WYNIKI:\n');
    console.log(`📅 27.11.2025:`);
    console.log(`   Wszystkie maile: ${nov27.length}`);
    console.log(`   Maile z generacji AI: ${nov27Generation.length}\n`);
    
    console.log(`📅 Dzisiaj (${todayStr}):`);
    console.log(`   Wszystkie maile: ${todayEmails.length}`);
    console.log(`   Maile z generacji AI: ${todayGeneration.length}\n`);
    
    if (nov27Generation.length > 0) {
      console.log('📧 Maile z generacji AI z 27.11.2025:\n');
      nov27Generation.forEach((email, i) => {
        console.log(`${i + 1}. ID: ${email.id}`);
        console.log(`   Do: ${Array.isArray(email.to) ? email.to.join(', ') : email.to}`);
        console.log(`   Temat: ${email.subject}`);
        console.log(`   Status: ${email.last_event || 'unknown'}`);
        console.log(`   Data: ${email.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nie znaleziono maili z generacji AI z 27.11.2025');
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    console.error(error.stack);
  }
}

checkNow();



