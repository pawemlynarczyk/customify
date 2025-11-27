// check-delayed-emails.js
// Sprawdza szczegóły maili "delivery delayed" przez Resend API

const https = require('https');

async function checkDelayedEmails(apiKey) {
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
    console.log('💡 Użyj: node check-delayed-emails.js re_...');
    console.log('💡 LUB: RESEND_API_KEY=re_... node check-delayed-emails.js');
    process.exit(1);
  }

  try {
    console.log('📧 Sprawdzam maile "delivery delayed"...\n');
    
    const response = await checkDelayedEmails(apiKey);
    
    if (response.error) {
      console.error('❌ Błąd Resend API:', response.error);
      return;
    }
    
    const emails = response.data || [];
    console.log(`✅ Pobrano ${emails.length} maili\n`);
    
    // Filtruj tylko "delivery delayed"
    const delayed = emails.filter(email => 
      email.last_event === 'delivery_delayed' || 
      email.last_event === 'delayed' ||
      (email.last_event && email.last_event.toLowerCase().includes('delayed'))
    );
    
    console.log(`⏳ Maile "delivery delayed": ${delayed.length}\n`);
    
    if (delayed.length > 0) {
      console.log('📧 Szczegóły maili "delivery delayed":\n');
      
      // Grupuj po domenie odbiorcy
      const byDomain = {};
      delayed.forEach(email => {
        const recipient = Array.isArray(email.to) ? email.to[0] : email.to;
        const domain = recipient ? recipient.split('@')[1] : 'unknown';
        if (!byDomain[domain]) {
          byDomain[domain] = [];
        }
        byDomain[domain].push(email);
      });
      
      console.log('📊 Podział po domenach odbiorców:\n');
      Object.keys(byDomain).forEach(domain => {
        console.log(`   ${domain}: ${byDomain[domain].length} maili`);
      });
      
      console.log('\n📧 Szczegóły (pierwsze 10):\n');
      delayed.slice(0, 10).forEach((email, i) => {
        const recipient = Array.isArray(email.to) ? email.to.join(', ') : email.to;
        console.log(`${i + 1}. ID: ${email.id}`);
        console.log(`   Do: ${recipient}`);
        console.log(`   Temat: ${email.subject}`);
        console.log(`   Status: ${email.last_event || 'unknown'}`);
        console.log(`   Data: ${email.created_at}`);
        if (email.error) {
          console.log(`   ❌ Błąd: ${email.error}`);
        }
        console.log('');
      });
      
      // Sprawdź czy są błędy
      const withErrors = delayed.filter(e => e.error);
      if (withErrors.length > 0) {
        console.log(`\n⚠️  Maile z błędami: ${withErrors.length}`);
        withErrors.slice(0, 5).forEach((email, i) => {
          console.log(`${i + 1}. ${email.to}: ${email.error}`);
        });
      }
    } else {
      console.log('✅ Nie znaleziono maili "delivery delayed" w ostatnich 1000 mailach');
      console.log('💡 Sprawdź w Resend Dashboard: https://resend.com/emails');
    }
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  }
}

main();

