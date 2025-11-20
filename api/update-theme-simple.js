module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { themeContent, fileName } = req.body;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shop = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';

    if (!accessToken) {
      return res.status(500).json({ error: 'Missing access token' });
    }

    console.log('🔧 Updating theme:', fileName);

    // Get current theme
    const themeResponse = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const themes = await themeResponse.json();
    const mainTheme = themes.themes.find(theme => theme.role === 'main');

    if (!mainTheme) {
      return res.status(404).json({ error: 'Main theme not found' });
    }

    console.log(`🎯 Using theme: ${mainTheme.name} (ID: ${mainTheme.id})`);

    // Update theme file
    const updateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset: {
          key: fileName || 'layout/theme.liquid',
          value: themeContent
        }
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Theme update error:', error);
      return res.status(500).json({ error: 'Failed to update theme', details: error });
    }

    const result = await updateResponse.json();
    console.log('✅ Theme updated successfully');
    console.log('📝 Shopify API response:', JSON.stringify(result, null, 2));
    console.log('📝 Shopify API response keys:', Object.keys(result));
    console.log('📝 Shopify API asset key:', result.asset?.key);
    console.log('📝 Shopify API asset value length:', result.asset?.value?.length || 0);
    
    // Sprawdź czy Shopify zwrócił błąd w JSON
    if (result.errors) {
      console.error('❌ Shopify API errors:', result.errors);
      return res.status(500).json({ error: 'Shopify API returned errors', details: result.errors });
    }
    
    // Sprawdź czy plik został faktycznie zaktualizowany (Shopify zwraca asset.value w odpowiedzi)
    if (result.asset && result.asset.value) {
      console.log('✅ Shopify zwrócił zaktualizowany plik w odpowiedzi (długość:', result.asset.value.length, 'znaków)');
    } else {
      console.warn('⚠️ Shopify NIE zwrócił zaktualizowanego pliku w odpowiedzi - może być problem z aktualizacją');
    }

    res.json({ 
      success: true, 
      message: 'Theme updated successfully',
      theme: mainTheme.name,
      file: fileName || 'layout/theme.liquid'
    });

  } catch (error) {
    console.error('❌ Theme update error:', error);
    res.status(500).json({ error: error.message });
  }
};
