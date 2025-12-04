// check-emails-direct.js
// Sprawdza maile BEZPOŚREDNIO przez Resend REST API

const https = require('https');

async function checkEmailsDirect(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.resend.com',
      path: '/emails?limit=1000',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  const apiKey = process.argv[2] || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Brak RESEND_API_KEY!');
    console.log('💡 Użyj: node check-emails-direct.js re_...');
    process.exit(1);
  }

  try {
    console.log('📧 Sprawdzam maile przez Resend API...\n');
    
    const response = await checkEmailsDirect(apiKey);
    
    if (response.error) {
      console.error('❌ Błąd Resend API:', response.error);
      return;
    }
    
    const emails = response.data || [];
    console.log(`✅ Pobrano ${emails.length} maili\n`);
    
    // Filtruj 27.11.2025
    const nov27 = emails.filter(email => {
      if (!email.created_at) return false;
      return email.created_at.startsWith('2025-11-27');
    });
    
    // Filtruj generacje AI
    const nov27Generation = nov27.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    // Dzisiaj
    const today = new Date().toISOString().split('T')[0];
    const todayEmails = emails.filter(email => {
      if (!email.created_at) return false;
      return email.created_at.startsWith(today);
    });
    
    const todayGeneration = todayEmails.filter(email => 
      email.subject && email.subject.includes('generacja AI')
    );
    
    console.log('📊 WYNIKI:\n');
    console.log(`📅 27.11.2025:`);
    console.log(`   Wszystkie: ${nov27.length}`);
    console.log(`   Generacje AI: ${nov27Generation.length}\n`);
    
    console.log(`📅 Dzisiaj (${today}):`);
    console.log(`   Wszystkie: ${todayEmails.length}`);
    console.log(`   Generacje AI: ${todayGeneration.length}\n`);
    
    if (nov27Generation.length > 0) {
      console.log('📧 Maile z generacji AI z 27.11.2025:\n');
      nov27Generation.forEach((email, i) => {
        console.log(`${i + 1}. ID: ${email.id}`);
        console.log(`   Do: ${Array.isArray(email.to) ? email.to.join(', ') : email.to}`);
        console.log(`   Status: ${email.last_event || 'unknown'}`);
        console.log(`   Data: ${email.created_at}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

main();



