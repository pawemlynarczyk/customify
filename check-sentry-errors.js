// check-sentry-errors.js - Pobiera błędy z Sentry API (gotowy do cron)
const https = require('https');
const fs = require('fs');
const path = require('path');

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN || 'YOUR_SENTRY_AUTH_TOKEN';
const SENTRY_ORG = process.env.SENTRY_ORG || 'your-org-slug';
const OUTPUT_DIR = path.join(__dirname, 'sentry-reports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `sentry-errors-${new Date().toISOString().split('T')[0]}.json`);

// Utwórz katalog na raporty jeśli nie istnieje
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function getSentryIssues(days = 14) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({ statsPeriod: `${days}d`, query: 'is:unresolved', sort: 'freq', limit: '100' });
    const options = {
      hostname: 'sentry.io',
      path: `/api/0/organizations/${SENTRY_ORG}/issues/?${query.toString()}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`, 'Content-Type': 'application/json' }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Parse error: ${e.message}`)); }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  if (SENTRY_AUTH_TOKEN === 'YOUR_SENTRY_AUTH_TOKEN') {
    console.error('❌ Ustaw SENTRY_AUTH_TOKEN i SENTRY_ORG jako zmienne środowiskowe\n');
    console.log('📋 Instrukcja:');
    console.log('1. https://sentry.io/settings/account/api/auth-tokens/');
    console.log('2. Utwórz token z: event:read, org:read, project:read');
    console.log('3. export SENTRY_AUTH_TOKEN="token"');
    console.log('4. export SENTRY_ORG="org-slug"');
    console.log('5. node check-sentry-errors.js\n');
    process.exit(1);
  }

  try {
    console.log(`⏳ Pobieram błędy z Sentry (${SENTRY_ORG})...`);
    const issues = await getSentryIssues(14);
    
    console.log(`✅ Znaleziono ${issues.length} błędów\n`);
    issues.sort((a, b) => b.count - a.count);
    
    // Przygotuj dane do zapisu
    const report = {
      generatedAt: new Date().toISOString(),
      org: SENTRY_ORG,
      totalIssues: issues.length,
      totalEvents: issues.reduce((sum, i) => sum + (parseInt(i.count) || 0), 0),
      topErrors: issues.slice(0, 20).map(issue => ({
        id: issue.id,
        title: issue.title,
        count: issue.count,
        userCount: issue.userCount || 0,
        lastSeen: issue.lastSeen,
        firstSeen: issue.firstSeen,
        url: `https://sentry.io/organizations/${SENTRY_ORG}/issues/${issue.id}/`
      })),
      allErrors: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        count: issue.count,
        userCount: issue.userCount || 0,
        lastSeen: issue.lastSeen
      }))
    };
    
    // Zapisz do pliku JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    console.log(`💾 Raport zapisany: ${OUTPUT_FILE}\n`);
    
    // Wyświetl w konsoli
    console.log('📊 TOP 20 NAJCZĘSTSZYCH BŁĘDÓW:\n');
    report.topErrors.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.count}x, ${issue.userCount} użytkowników] ${issue.title}`);
      console.log(`   ID: ${issue.id} | Ostatni: ${new Date(issue.lastSeen).toLocaleString('pl-PL')}`);
      console.log(`   URL: ${issue.url}\n`);
    });

    console.log(`\n📈 STATYSTYKI:`);
    console.log(`   Łącznie eventów: ${report.totalEvents}`);
    console.log(`   Łącznie błędów: ${report.totalIssues}`);
    console.log(`   Raport zapisany w: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();
