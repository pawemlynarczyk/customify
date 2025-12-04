const fs = require('fs');

// Wczytaj klientów z generacjami
const customers = JSON.parse(fs.readFileSync('customers-with-generations.json', 'utf-8'));

console.log(`📧 Wysyłam emaile do ${customers.length} klientów...\n`);

// Przygotuj dane (tylko email i customerId)
const customersData = customers.map(c => ({
  email: c.email,
  customerId: c.customerId
}));

// Wyślij request
async function sendBulkEmails() {
  try {
    const response = await fetch('https://customify-s56o.vercel.app/api/send-bulk-generation-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customers: customersData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    console.log('\n' + '='.repeat(60));
    console.log('📊 WYNIKI WYSYŁKI:');
    console.log('='.repeat(60));
    console.log(`✅ Wysłano: ${data.sent || 0}`);
    console.log(`❌ Błędy: ${data.failed || 0}`);
    console.log(`📊 Łącznie: ${data.total || 0}`);
    console.log('='.repeat(60) + '\n');

    if (data.results) {
      if (data.results.failed && data.results.failed.length > 0) {
        console.log('❌ Błędy:');
        data.results.failed.slice(0, 10).forEach(f => {
          console.log(`   - ${f.email}: ${f.error}`);
        });
        if (data.results.failed.length > 10) {
          console.log(`   ... i ${data.results.failed.length - 10} więcej`);
        }
      }
    }

    // Zapisz wyniki
    fs.writeFileSync(
      'bulk-email-results.json',
      JSON.stringify(data, null, 2)
    );
    console.log('💾 Zapisano wyniki do: bulk-email-results.json\n');

  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

sendBulkEmails();



