// api/admin/login-modal-stats-test.js
/**
 * Testowy endpoint do diagnostyki problemów z autoryzacją
 * Pokazuje czy token jest ustawiony i czy pasuje (bez ujawniania wartości)
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.ADMIN_STATS_TOKEN || 'customify-admin-2024';
    const expectedAuth = `Bearer ${expectedToken}`;
    
    // Sprawdź czy token jest ustawiony w Vercel
    const tokenIsSet = !!process.env.ADMIN_STATS_TOKEN;
    const tokenLength = expectedToken.length;
    const tokenFirstChar = expectedToken.substring(0, 1);
    const tokenLastChar = expectedToken.substring(tokenLength - 1);
    
    // Sprawdź czy request ma header Authorization
    const hasAuthHeader = !!authHeader;
    
    // Sprawdź czy tokeny pasują (bez ujawniania wartości)
    const tokensMatch = authHeader === expectedAuth;
    
    return res.json({
      success: true,
      diagnostics: {
        tokenFromVercel: {
          isSet: tokenIsSet,
          length: tokenLength,
          firstChar: tokenFirstChar,
          lastChar: tokenLastChar,
          preview: tokenIsSet 
            ? `${tokenFirstChar}${'*'.repeat(Math.max(0, tokenLength - 2))}${tokenLastChar}`
            : 'NOT SET (using fallback)'
        },
        request: {
          hasAuthHeader: hasAuthHeader,
          authHeaderLength: authHeader ? authHeader.length : 0,
          authHeaderPreview: authHeader 
            ? `${authHeader.substring(0, 20)}...` 
            : 'MISSING'
        },
        comparison: {
          tokensMatch: tokensMatch,
          expectedLength: expectedAuth.length,
          receivedLength: authHeader ? authHeader.length : 0
        },
        recommendation: tokensMatch 
          ? '✅ Tokens match! Authorization should work.'
          : !hasAuthHeader
          ? '❌ Missing Authorization header. Check if HTML sends the header.'
          : !tokenIsSet
          ? '⚠️ ADMIN_STATS_TOKEN not set in Vercel. Using fallback. Make sure token in HTML matches fallback.'
          : '❌ Tokens do not match. Update token in HTML to match Vercel ADMIN_STATS_TOKEN.'
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN-MODAL-STATS-TEST] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

