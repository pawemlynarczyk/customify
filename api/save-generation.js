// api/save-generation.js
/**
 * API endpoint do zapisywania generacji AI z powiązaniem do klienta
 * Zapisuje w Vercel Blob Storage: customerId/email → lista generacji (JSON)
 */

const { put, head } = require('@vercel/blob');
const { checkRateLimit, getClientIP } = require('../utils/vercelRateLimiter');

module.exports = async (req, res) => {
  console.log(`💾 [SAVE-GENERATION] API called - Method: ${req.method}`);
  
  // CORS headers
  const allowedOrigins = [
    'https://lumly.pl',
    'https://customify-s56o.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // IP-based rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip, 50, 15 * 60 * 1000)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP',
        retryAfter: 900
      });
    }

    const { customerId, email, imageUrl, style, productType, originalImageUrl } = req.body;

    // Walidacja wymaganych pól
    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Missing required field: imageUrl' 
      });
    }

    // Musi być customerId LUB email
    if (!customerId && !email) {
      return res.status(400).json({ 
        error: 'Missing required field: customerId or email' 
      });
    }

    // Sprawdź czy Vercel Blob Storage jest skonfigurowany
    if (!process.env.customify_READ_WRITE_TOKEN) {
      console.error('❌ [SAVE-GENERATION] Vercel Blob Storage not configured');
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Vercel Blob Storage not configured - generation not saved',
        message: 'Generation saved locally only'
      });
    }

    // Określ identyfikator klienta (priorytet: customerId > email > IP)
    let keyPrefix = 'customer';
    let identifier = customerId;
    
    if (!customerId && email) {
      keyPrefix = 'email';
      identifier = email.toLowerCase().trim();
    } else if (!customerId && !email) {
      // Fallback do IP (nie zalecane, ale lepsze niż nic)
      keyPrefix = 'ip';
      identifier = ip;
      console.warn('⚠️ [SAVE-GENERATION] Using IP as identifier (no customerId or email)');
    }

    // Path w Vercel Blob Storage dla JSON z generacjami
    const blobPath = `customify/generations/${keyPrefix}-${identifier.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    console.log(`📝 [SAVE-GENERATION] Blob Path: ${blobPath}`);

    // Generuj unikalny ID dla generacji
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Nowa generacja
    const newGeneration = {
      id: generationId,
      imageUrl: imageUrl,
      style: style || 'unknown',
      productType: productType || 'other',
      originalImageUrl: originalImageUrl || null,
      date: new Date().toISOString(),
      purchased: false,
      orderId: null,
      purchaseDate: null
    };

    // Pobierz istniejące generacje z Vercel Blob Storage
    let existingData = null;
    try {
      // Spróbuj sprawdzić czy plik istnieje używając head()
      const existingBlob = await head(blobPath, {
        token: process.env.customify_READ_WRITE_TOKEN
      }).catch(() => null);
      
      if (existingBlob && existingBlob.url) {
        // Plik istnieje - pobierz go
        const existingResponse = await fetch(existingBlob.url);
        if (existingResponse.ok) {
          existingData = await existingResponse.json();
          console.log(`📊 [SAVE-GENERATION] Existing data found: ${existingData.generations?.length || 0} generations`);
        }
      } else {
        console.log(`📊 [SAVE-GENERATION] No existing file found - creating new`);
      }
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error reading existing file:', blobError);
      // Kontynuuj - utworzymy nowy rekord
    }

    // Przygotuj dane do zapisu
    let dataToSave;
    
    if (existingData && Array.isArray(existingData.generations)) {
      // Dodaj nową generację do istniejącej tablicy
      existingData.generations.unshift(newGeneration); // Dodaj na początku
      // Zachowaj ostatnie 50 generacji (limit)
      if (existingData.generations.length > 50) {
        existingData.generations = existingData.generations.slice(0, 50);
      }
      dataToSave = {
        ...existingData,
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: existingData.generations.length
      };
    } else {
      // Utwórz nowy rekord
      dataToSave = {
        customerId: customerId || null,
        email: email || null,
        ip: ip,
        generations: [newGeneration],
        lastGenerationDate: new Date().toISOString(),
        totalGenerations: 1,
        purchasedCount: 0,
        createdAt: new Date().toISOString()
      };
    }

    // Zapisz w Vercel Blob Storage jako JSON
    try {
      const jsonData = JSON.stringify(dataToSave, null, 2);
      const jsonBuffer = Buffer.from(jsonData, 'utf-8');
      
      const blob = await put(blobPath, jsonBuffer, {
        access: 'public',
        contentType: 'application/json',
        token: process.env.customify_READ_WRITE_TOKEN
      });
      
      console.log(`✅ [SAVE-GENERATION] Saved to Blob: ${blob.url}`);
    } catch (blobError) {
      console.error('❌ [SAVE-GENERATION] Error writing to Blob:', blobError);
      // Nie blokuj - zwróć sukces ale z warningiem
      return res.json({
        success: true,
        warning: 'Failed to save to Vercel Blob Storage',
        message: 'Generation saved locally only',
        generationId: generationId
      });
    }

    // ✅ AKTUALIZUJ CUSTOMER METAFIELD W SHOPIFY (jeśli customerId)
    // To pozwoli wyświetlić generacje w Shopify Admin na koncie klienta
    console.log(`🔍 [SAVE-GENERATION] Sprawdzam customerId:`, customerId, typeof customerId);
    console.log(`🔍 [SAVE-GENERATION] Email fallback:`, email);
    
    if (customerId) {
      try {
        console.log(`📝 [SAVE-GENERATION] Aktualizuję Customer Metafield w Shopify dla ${customerId}...`);
        console.log(`📊 [SAVE-GENERATION] Generacje do zapisania: ${dataToSave.generations.length}`);
        console.log(`📊 [SAVE-GENERATION] Przykładowa generacja:`, dataToSave.generations[0] ? {
          id: dataToSave.generations[0].id,
          imageUrl: dataToSave.generations[0].imageUrl?.substring(0, 50) + '...',
          style: dataToSave.generations[0].style
        } : 'brak');
        
        const shopDomain = process.env.SHOP_DOMAIN || 'customify-ok.myshopify.com';
        const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        
        if (!accessToken) {
          console.warn('⚠️ [SAVE-GENERATION] SHOPIFY_ACCESS_TOKEN nie jest skonfigurowany - pomijam aktualizację metafielda');
        } else {
          // Przygotuj dane do zapisu (tylko podstawowe info - metafield ma limit)
          const generationsData = {
            totalGenerations: dataToSave.generations.length,
            purchasedCount: dataToSave.generations.filter(g => g.purchased).length,
            lastGenerationDate: dataToSave.generations[0]?.date || null,
            generations: dataToSave.generations.slice(0, 20).map(gen => ({
              id: gen.id,
              imageUrl: gen.imageUrl,
              style: gen.style,
              date: gen.date,
              purchased: gen.purchased || false,
              orderId: gen.orderId || null
            }))
          };
          
          // GraphQL mutation do aktualizacji Customer Metafield
          const mutation = `
            mutation updateCustomerGenerations($input: CustomerInput!) {
              customerUpdate(input: $input) {
                customer {
                  id
                  metafield(namespace: "customify", key: "ai_generations") {
                    id
                    value
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          
          // ✅ SPRAWDŹ CZY customerId TO NUMERYCZNY ID (Shopify Customer ID)
          // Shopify Customer ID to numeryczny string (np. "123456789")
          let shopifyCustomerId = customerId;
          
          // Jeśli customerId zawiera "gid://shopify/Customer/", usuń prefix
          if (customerId.includes('gid://shopify/Customer/')) {
            shopifyCustomerId = customerId.replace('gid://shopify/Customer/', '');
            console.log(`🔧 [SAVE-GENERATION] Usunięto prefix GID, customerId: ${shopifyCustomerId}`);
          }
          
          // Jeśli customerId nie jest numeryczny, sprawdź czy to może być email
          if (!/^\d+$/.test(shopifyCustomerId)) {
            console.warn(`⚠️ [SAVE-GENERATION] customerId nie jest numeryczny: ${shopifyCustomerId}`);
            console.warn(`⚠️ [SAVE-GENERATION] Shopify Customer ID musi być numeryczny (np. "123456789")`);
            // Nie blokuj - spróbuj użyć jako jest (może działać)
          }
          
          console.log(`🔍 [SAVE-GENERATION] Używam shopifyCustomerId: ${shopifyCustomerId}`);
          console.log(`🔍 [SAVE-GENERATION] GID format: gid://shopify/Customer/${shopifyCustomerId}`);
          
          const variables = {
            input: {
              id: `gid://shopify/Customer/${shopifyCustomerId}`,
              metafields: [
                {
                  namespace: 'customify',
                  key: 'ai_generations',
                  value: JSON.stringify(generationsData),
                  type: 'json'
                }
              ]
            }
          };
          
          console.log(`🔍 [SAVE-GENERATION] GraphQL variables:`, JSON.stringify(variables, null, 2));
          
          const updateResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              query: mutation,
              variables: variables
            })
          });
          
          const updateData = await updateResponse.json();
          
          console.log(`🔍 [SAVE-GENERATION] GraphQL response status: ${updateResponse.status}`);
          console.log(`🔍 [SAVE-GENERATION] GraphQL response:`, JSON.stringify(updateData, null, 2));
          
          if (updateData.errors) {
            console.error('❌ [SAVE-GENERATION] GraphQL errors:', JSON.stringify(updateData.errors, null, 2));
            // Sprawdź czy to błąd "metafield definition not found"
            const metafieldNotFound = updateData.errors.some(err => 
              err.message?.toLowerCase().includes('metafield') || 
              err.message?.toLowerCase().includes('definition') ||
              err.message?.toLowerCase().includes('not found') ||
              err.message?.toLowerCase().includes('does not exist')
            );
            if (metafieldNotFound) {
              console.warn('⚠️ [SAVE-GENERATION] Metafield definition nie istnieje!');
              console.warn('⚠️ [SAVE-GENERATION] Uruchom: GET https://customify-s56o.vercel.app/api/setup-customer-generations-metafield');
            }
            
            // Sprawdź czy to błąd "Customer not found"
            const customerNotFound = updateData.errors.some(err => 
              err.message?.toLowerCase().includes('customer') && 
              (err.message?.toLowerCase().includes('not found') || err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('invalid'))
            );
            if (customerNotFound) {
              console.error('❌ [SAVE-GENERATION] Customer nie został znaleziony w Shopify!');
              console.error('❌ [SAVE-GENERATION] Sprawdź czy customerId jest poprawny:', shopifyCustomerId);
              console.error('❌ [SAVE-GENERATION] customerId type:', typeof shopifyCustomerId);
              console.error('❌ [SAVE-GENERATION] customerId value:', shopifyCustomerId);
            }
          } else if (updateData.data?.customerUpdate?.userErrors?.length > 0) {
            console.error('❌ [SAVE-GENERATION] User errors:', JSON.stringify(updateData.data.customerUpdate.userErrors, null, 2));
            // Sprawdź czy to błąd "metafield definition not found"
            const metafieldNotFound = updateData.data.customerUpdate.userErrors.some(err => 
              err.message?.toLowerCase().includes('metafield') || 
              err.message?.toLowerCase().includes('definition') ||
              err.message?.toLowerCase().includes('not found')
            );
            if (metafieldNotFound) {
              console.warn('⚠️ [SAVE-GENERATION] Metafield definition nie istnieje!');
              console.warn('⚠️ [SAVE-GENERATION] Uruchom: GET https://customify-s56o.vercel.app/api/setup-customer-generations-metafield');
            }
            
            // Sprawdź czy to błąd "Customer not found"
            const customerNotFound = updateData.data.customerUpdate.userErrors.some(err => 
              err.message?.toLowerCase().includes('customer') && 
              (err.message?.toLowerCase().includes('not found') || err.message?.toLowerCase().includes('does not exist') || err.message?.toLowerCase().includes('invalid'))
            );
            if (customerNotFound) {
              console.error('❌ [SAVE-GENERATION] Customer nie został znaleziony w Shopify!');
              console.error('❌ [SAVE-GENERATION] Sprawdź czy customerId jest poprawny:', shopifyCustomerId);
            }
          } else if (updateData.data?.customerUpdate?.customer) {
            console.log(`✅ [SAVE-GENERATION] Customer Metafield zaktualizowany: ${generationsData.totalGenerations} generacji`);
            console.log(`📊 [SAVE-GENERATION] Kupione: ${generationsData.purchasedCount}, Nie kupione: ${generationsData.totalGenerations - generationsData.purchasedCount}`);
            console.log(`📊 [SAVE-GENERATION] Customer ID: ${updateData.data.customerUpdate.customer.id}`);
            console.log(`📊 [SAVE-GENERATION] Metafield value length: ${updateData.data.customerUpdate.customer.metafield?.value?.length || 0} znaków`);
            console.log(`📊 [SAVE-GENERATION] Metafield value preview: ${updateData.data.customerUpdate.customer.metafield?.value?.substring(0, 200) || 'brak'}...`);
          } else {
            console.warn('⚠️ [SAVE-GENERATION] Nieoczekiwana odpowiedź z GraphQL - brak customer w response');
            console.warn('⚠️ [SAVE-GENERATION] Response:', JSON.stringify(updateData, null, 2));
          }
        }
      } catch (updateError) {
        console.error('❌ [SAVE-GENERATION] Błąd aktualizacji Customer Metafield:', updateError.message);
        console.error('❌ [SAVE-GENERATION] Stack:', updateError.stack);
        // Nie blokuj - zapis w Blob Storage się udał
      }
    }

    return res.json({
      success: true,
      generationId: generationId,
      blobPath: blobPath,
      totalGenerations: dataToSave.totalGenerations,
      message: 'Generation saved successfully'
    });

  } catch (error) {
    console.error('❌ [SAVE-GENERATION] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

