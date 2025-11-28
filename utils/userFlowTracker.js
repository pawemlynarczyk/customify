// utils/userFlowTracker.js
/**
 * Tracking flow użytkownika - błędy i akcje
 * Zapisuje do Vercel Blob Storage: customify/stats/user-flow/{date}.json
 */

const { put, head, get } = require('@vercel/blob');
const crypto = require('crypto');

/**
 * Hashuje wrażliwe dane (device token, IP)
 */
function hashSensitiveData(data) {
  if (!data) return null;
  return crypto.createHash('sha256').update(String(data)).digest('hex').substring(0, 16);
}

/**
 * Zapisuje event do Vercel Blob Storage (asynchronicznie, nie blokuje)
 */
async function saveUserFlowEvent(event) {
  // ⚠️ NIE BLOKUJ - jeśli błąd, po prostu loguj i kontynuuj
  try {
    // Sprawdź czy token jest dostępny
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.warn('⚠️ [USER-FLOW] customify_READ_WRITE_TOKEN nie jest ustawiony - pomijam zapis');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const blobPath = `customify/stats/user-flow/${today}.json`;
    console.log(`📊 [USER-FLOW] Zapisuję event do: ${blobPath}`);
    
    // Pobierz istniejący plik (jeśli istnieje)
    let existingData = { date: today, events: [] };
    try {
      const existingBlob = await head(blobPath, {
        token: process.env.customify_READ_WRITE_TOKEN
      }).catch(() => null);
      
      if (existingBlob && existingBlob.url) {
        const response = await fetch(existingBlob.url);
        if (response.ok) {
          existingData = await response.json();
          // Walidacja: upewnij się że events jest tablicą
          if (!Array.isArray(existingData.events)) {
            existingData.events = [];
          }
        }
      }
    } catch (headError) {
      // Plik nie istnieje - to pierwszy event dzisiaj
      console.log(`📊 [USER-FLOW] Pierwszy event dzisiaj - tworzę nowy plik`);
    }
    
    // Hashuj wrażliwe dane
    const safeEvent = {
      ...event,
      device_token_hash: event.device_token ? hashSensitiveData(event.device_token) : null,
      ip_hash: event.ip ? hashSensitiveData(event.ip) : null,
      // Usuń oryginalne wrażliwe dane
      device_token: undefined,
      ip: undefined
    };
    
    // Dodaj event do tablicy
    existingData.events.push({
      ...safeEvent,
      timestamp: new Date().toISOString()
    });
    
    // Zapisz z powrotem do Blob
    const jsonData = JSON.stringify(existingData, null, 2);
    const jsonBuffer = Buffer.from(jsonData, 'utf-8');
    
    await put(blobPath, jsonBuffer, {
      access: 'public',
      contentType: 'application/json',
      token: process.env.customify_READ_WRITE_TOKEN,
      allowOverwrite: true
    });
    
    console.log(`✅ [USER-FLOW] Event zapisany: ${event.type} - ${event.error_type || event.action || 'unknown'}`);
  } catch (error) {
    // ⚠️ NIE RZUCAJ BŁĘDU - to nie może zepsuć głównego flow
    console.error('❌ [USER-FLOW] Błąd zapisu eventu (nie blokuję):', error.message);
  }
}

/**
 * Zapisuje event błędu (asynchronicznie)
 */
function trackError(errorType, userStatus, deviceToken, ip, details = {}) {
  // ⚠️ ASYNCHRONICZNIE - nie czekaj na odpowiedź
  console.log(`📊 [USER-FLOW] trackError wywołany: ${errorType}, user: ${userStatus}, device: ${deviceToken ? deviceToken.substring(0, 8) + '...' : 'null'}`);
  saveUserFlowEvent({
    type: 'error',
    error_type: errorType,
    user_status: userStatus,
    device_token: deviceToken,
    ip: ip,
    details: details
  }).catch(err => {
    console.error('❌ [USER-FLOW] Błąd trackError (ignoruję):', err.message);
    console.error('❌ [USER-FLOW] Stack:', err.stack);
  });
}

/**
 * Zapisuje akcję użytkownika (asynchronicznie)
 */
function trackAction(action, userStatus, deviceToken, ip, details = {}) {
  // ⚠️ ASYNCHRONICZNIE - nie czekaj na odpowiedź
  saveUserFlowEvent({
    type: 'action',
    action: action,
    user_status: userStatus,
    device_token: deviceToken,
    ip: ip,
    details: details
  }).catch(err => {
    console.error('❌ [USER-FLOW] Błąd trackAction (ignoruję):', err.message);
  });
}

/**
 * Sprawdza czy w ostatnich X godzinach był błąd dla tego device token
 * Zwraca ostatni błąd lub null
 */
async function getRecentError(deviceToken, hours = 2) {
  try {
    if (!deviceToken || !process.env.customify_READ_WRITE_TOKEN) {
      return null;
    }
    
    const deviceTokenHash = hashSensitiveData(deviceToken);
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Sprawdź dzisiejszy plik i wczorajszy (na wypadek zmiany daty)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    for (const date of [today, yesterday]) {
      const blobPath = `customify/stats/user-flow/${date}.json`;
      
      try {
        const blob = await head(blobPath, {
          token: process.env.customify_READ_WRITE_TOKEN
        }).catch(() => null);
        
        if (blob && blob.url) {
          const response = await fetch(blob.url);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.events)) {
              // Znajdź ostatni błąd dla tego device token
              const recentError = data.events
                .filter(e => 
                  e.type === 'error' && 
                  e.device_token_hash === deviceTokenHash &&
                  e.timestamp >= cutoffTime
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
              
              if (recentError) {
                return recentError;
              }
            }
          }
        }
      } catch (err) {
        // Ignoruj błędy - po prostu sprawdź następny plik
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ [USER-FLOW] Błąd getRecentError (ignoruję):', error.message);
    return null;
  }
}

module.exports = {
  trackError,
  trackAction,
  getRecentError
};

