#!/usr/bin/env node

/**
 * Test IMAGE HASH LIMIT feature
 * Wysyła ten sam obrazek 5 razy i sprawdza czy 5. próba jest zablokowana
 */

const crypto = require('crypto');

// Prosty testowy obrazek (1x1 pixel PNG w base64)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Oblicz hash (tak samo jak w kodzie)
function calculateImageHash(imageData) {
  const base64Data = imageData.includes('base64,') 
    ? imageData.split('base64,')[1] 
    : imageData;
  const buffer = Buffer.from(base64Data, 'base64');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const imageHash = calculateImageHash(TEST_IMAGE_BASE64);

console.log('🧪 TEST IMAGE HASH LIMIT');
console.log('========================');
console.log('');
console.log(`📸 Test image hash: ${imageHash.substring(0, 16)}...`);
console.log('');
console.log('📋 Test plan:');
console.log('1. Wyślij ten sam obrazek 5 razy');
console.log('2. Pierwsze 4 powinny przejść ✅');
console.log('3. Piąta powinna być zablokowana ❌');
console.log('');
console.log('⏳ Wysyłam requesty...');
console.log('');

async function testImageHashLimit() {
  const API_URL = 'https://customify-s56o.vercel.app/api/transform';
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n🔄 Request ${i}/5:`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: TEST_IMAGE_BASE64,
          prompt: 'test',
          style: 'boho-minimalistyczny',
          productType: 'boho'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS (${response.status})`);
        console.log(`   Message: Transformacja udana`);
      } else {
        console.log(`   ❌ BLOCKED (${response.status})`);
        console.log(`   Error: ${data.error}`);
        console.log(`   Message: ${data.message}`);
        
        if (data.imageBlocked) {
          console.log(`   🎯 IMAGE HASH LIMIT DZIAŁA! Obrazek zablokowany po ${data.count}/${data.limit} użyciach`);
          
          if (i === 5) {
            console.log('\n✅ TEST PASSED: Feature działa poprawnie!');
            return true;
          }
        }
      }
      
      // Poczekaj 1 sekundę między requestami
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n⚠️ TEST FAILED: 5. request nie został zablokowany');
  return false;
}

// Uruchom test
testImageHashLimit().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Test error:', error);
  process.exit(1);
});

