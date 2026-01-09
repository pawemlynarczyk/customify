// check-sentry-issue-details.js - Pobiera szczegóły konkretnego błędu z Sentry
const https = require('https');

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN || 'YOUR_SENTRY_AUTH_TOKEN';
const SENTRY_ORG = process.env.SENTRY_ORG || 'your-org-slug';
const ISSUE_ID = process.argv[2] || '80114466'; // ID błędu jako argument

async function getIssueDetails(issueId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sentry.io',
      path: `/api/0/organizations/${SENTRY_ORG}/issues/${issueId}/`,
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`, 
        'Content-Type': 'application/json' 
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { 
            resolve(JSON.parse(data)); 
          } catch (e) { 
            reject(new Error(`Parse error: ${e.message}`)); 
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function getIssueEvents(issueId, limit = 5) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sentry.io',
      path: `/api/0/organizations/${SENTRY_ORG}/issues/${issueId}/events/?limit=${limit}`,
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${SENTRY_AUTH_TOKEN}`, 
        'Content-Type': 'application/json' 
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { 
            resolve(JSON.parse(data)); 
          } catch (e) { 
            reject(new Error(`Parse error: ${e.message}`)); 
          }
        } else {
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  if (SENTRY_AUTH_TOKEN === 'YOUR_SENTRY_AUTH_TOKEN') {
    console.error('❌ Ustaw SENTRY_AUTH_TOKEN i SENTRY_ORG\n');
    process.exit(1);
  }

  try {
    console.log(`⏳ Pobieram szczegóły błędu ${ISSUE_ID}...\n`);
    
    // Pobierz szczegóły błędu
    const issue = await getIssueDetails(ISSUE_ID);
    
    console.log('📋 SZCZEGÓŁY BŁĘDU:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${issue.id}`);
    console.log(`Tytuł: ${issue.title}`);
    console.log(`Liczba wystąpień: ${issue.count}`);
    console.log(`Użytkowników dotkniętych: ${issue.userCount}`);
    console.log(`Ostatni raz: ${new Date(issue.lastSeen).toLocaleString('pl-PL')}`);
    console.log(`Pierwszy raz: ${new Date(issue.firstSeen).toLocaleString('pl-PL')}`);
    console.log(`Status: ${issue.status}`);
    console.log(`Level: ${issue.level}`);
    console.log(`URL: https://sentry.io/organizations/${SENTRY_ORG}/issues/${issue.id}/`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Pobierz ostatnie eventy (ze stack trace)
    console.log('📊 OSTATNIE EVENTY (ze stack trace):\n');
    const events = await getIssueEvents(ISSUE_ID, 3);
    
    events.forEach((event, index) => {
      console.log(`\n🔴 EVENT #${index + 1}:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Data: ${new Date(event.dateCreated).toLocaleString('pl-PL')}`);
      console.log(`ID: ${event.id}`);
      
      // Stack trace
      if (event.entries) {
        const exceptionEntry = event.entries.find(e => e.type === 'exception');
        if (exceptionEntry && exceptionEntry.data && exceptionEntry.data.values) {
          const exception = exceptionEntry.data.values[0];
          console.log(`\n📝 TYP BŁĘDU: ${exception.type}`);
          console.log(`📝 KOMUNIKAT: ${exception.value}`);
          
          if (exception.stacktrace && exception.stacktrace.frames) {
            console.log(`\n📍 STACK TRACE (ostatnie 10 linii):`);
            const frames = exception.stacktrace.frames.reverse().slice(0, 10);
            frames.forEach((frame, i) => {
              const file = frame.filename || 'unknown';
              const line = frame.lineno || '?';
              const func = frame.function || '?';
              console.log(`  ${i + 1}. ${func} (${file}:${line})`);
            });
          }
        }
      }
      
      // Context (URL, user agent, etc.)
      if (event.contexts) {
        console.log(`\n🌐 KONTEKST:`);
        if (event.contexts.browser) {
          console.log(`  Przeglądarka: ${event.contexts.browser.name} ${event.contexts.browser.version}`);
        }
        if (event.contexts.device) {
          console.log(`  Urządzenie: ${event.contexts.device.name || 'Unknown'}`);
        }
      }
      
      if (event.request) {
        console.log(`\n🔗 REQUEST:`);
        console.log(`  URL: ${event.request.url || 'N/A'}`);
        console.log(`  Method: ${event.request.method || 'N/A'}`);
      }
      
      if (event.user) {
        console.log(`\n👤 UŻYTKOWNIK:`);
        console.log(`  ID: ${event.user.id || 'N/A'}`);
        console.log(`  Email: ${event.user.email || 'N/A'}`);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    console.log(`\n✅ Pobrano ${events.length} eventów\n`);
    
  } catch (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }
}

main();

