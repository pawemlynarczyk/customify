// api/stats/user-flow.js
/**
 * Endpoint do odczytu statystyk flow użytkownika
 * Zwraca błędy i akcje z danego dnia
 */

const { get, head } = require('@vercel/blob');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Pobierz datę z query (domyślnie dzisiaj)
    // Użyj UTC żeby uniknąć problemów z timezone
    const today = new Date();
    const dateParam = req.query.date || today.toISOString().split('T')[0];
    const blobPath = `customify/stats/user-flow/${dateParam}.json`;
    
    console.log(`📊 [STATS] Pobieram statystyki dla daty: ${dateParam}, ścieżka: ${blobPath}`);

    // Sprawdź czy token jest dostępny
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.warn('⚠️ [STATS] customify_READ_WRITE_TOKEN nie jest ustawiony');
      return res.status(500).json({
        error: 'Blob token not configured',
        date: dateParam
      });
    }
    
    // Sprawdź czy plik istnieje
    const blob = await head(blobPath, {
      token: process.env.customify_READ_WRITE_TOKEN
    }).catch(() => null);

    if (!blob || !blob.url) {
      console.log(`📊 [STATS] Plik nie istnieje: ${blobPath}`);
      return res.status(200).json({
        date: dateParam,
        events: [],
        stats: {
          total_events: 0,
          errors: {},
          actions: {},
          conversion_rate: {}
        }
      });
    }
    
    console.log(`📊 [STATS] Plik istnieje: ${blob.url}`);

    // Pobierz dane
    const response = await fetch(blob.url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    const data = await response.json();
    const events = data.events || [];

    // Oblicz statystyki
    const stats = {
      total_events: events.length,
      errors: {},
      actions: {},
      conversion_rate: {}
    };

    // Grupuj błędy
    const errors = events.filter(e => e.type === 'error');
    errors.forEach(error => {
      const key = error.error_type || 'unknown';
      if (!stats.errors[key]) {
        stats.errors[key] = {
          total: 0,
          logged_in: 0,
          not_logged_in: 0
        };
      }
      stats.errors[key].total++;
      if (error.user_status === 'logged_in') {
        stats.errors[key].logged_in++;
      } else {
        stats.errors[key].not_logged_in++;
      }
    });

    // Grupuj akcje
    const actions = events.filter(e => e.type === 'action');
    actions.forEach(action => {
      const key = action.action || 'unknown';
      if (!stats.actions[key]) {
        stats.actions[key] = {
          total: 0,
          logged_in: 0,
          not_logged_in: 0
        };
      }
      stats.actions[key].total++;
      if (action.user_status === 'logged_in') {
        stats.actions[key].logged_in++;
      } else {
        stats.actions[key].not_logged_in++;
      }
    });

    // Oblicz conversion rate (błąd → logowanie)
    Object.keys(stats.errors).forEach(errorType => {
      const errorCount = stats.errors[errorType].total;
      const loginAfterError = stats.actions['login_after_error']?.total || 0;
      // Uproszczone: zakładamy że login_after_error dotyczy ostatniego błędu
      // W rzeczywistości trzeba by było matchować po device_token_hash
      stats.conversion_rate[errorType] = errorCount > 0 
        ? ((loginAfterError / errorCount) * 100).toFixed(1) + '%'
        : '0%';
    });

    return res.status(200).json({
      date: dateParam,
      events: events,
      stats: stats
    });

  } catch (error) {
    console.error('❌ [STATS] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

