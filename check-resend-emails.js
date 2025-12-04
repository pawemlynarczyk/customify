// check-resend-emails.js
// Sprawdza maile przez Resend API

const { Resend } = require('resend');

async function checkEmails() {
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY nie jest ustawiony w środowisku');
    console.log('💡 Użyj: RESEND_API_KEY=re_... node check-resend-emails.js');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    console.log('📧 Sprawdzam maile w Resend...\n');
    
    // Pobierz listę maili z ostatnich 7 dni
    const response = await resend.emails.list({
      limit: 100
    });
    
    if (response.error) {
      console.error('❌ Błąd Resend API:', response.error);
      return;
    }
    
    const emails = response.data?.data || [];
    
    // Filtruj maile z 27.11.2025
    const nov27 = emails.filter(email => {
      const date = new Date(email.created_at);
      return date.toISOString().startsWith('2025-11-27');
    });
    
    // Filtruj maile z dzisiaj
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEmails = emails.filter(email => {
      const date = new Date(email.created_at);
      return date.toISOString().startsWith(todayStr);
    });
    
    console.log('📊 WYNIKI:\n');
    console.log(`📅 Dzisiaj (${todayStr}): ${todayEmails.length} maili`);
    console.log(`📅 27.11.2025: ${nov27.length} maili`);
    console.log(`📦 Łącznie (ostatnie 100): ${emails.length} maili\n`);
    
    if (nov27.length > 0) {
      console.log('📧 Maile z 27.11.2025:\n');
      nov27.forEach((email, i) => {
        console.log(`${i + 1}. ID: ${email.id}`);
        console.log(`   Do: ${email.to}`);
        console.log(`   Temat: ${email.subject}`);
        console.log(`   Status: ${email.last_event || 'unknown'}`);
        console.log(`   Data: ${email.created_at}\n`);
      });
    }
    
    if (todayEmails.length > 0 && todayStr !== '2025-11-27') {
      console.log('📧 Maile z dzisiaj:\n');
      todayEmails.forEach((email, i) => {
        console.log(`${i + 1}. ID: ${email.id}`);
        console.log(`   Do: ${email.to}`);
        console.log(`   Temat: ${email.subject}`);
        console.log(`   Status: ${email.last_event || 'unknown'}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

checkEmails();



