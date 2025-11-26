// api/check-customer-generations.js
/**
 * API endpoint do sprawdzania czy klienci z CSV mają generacje w Vercel Blob
 * POST: { customers: [{ customerId, email }] }
 * Returns: { withGenerations: [...], withoutGenerations: [...] }
 */

const { head } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ error: 'customers array required' });
    }

    const BLOB_TOKEN = process.env.customify_READ_WRITE_TOKEN;
    if (!BLOB_TOKEN) {
      return res.status(500).json({ error: 'BLOB token not configured' });
    }

    const results = {
      withGenerations: [],
      withoutGenerations: [],
      errors: []
    };

    console.log(`🔍 Sprawdzam ${customers.length} klientów...`);

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const customerId = customer.customerId;
      const email = customer.email?.toLowerCase();

      if (!customerId || !email) {
        results.errors.push({ customer, error: 'Missing customerId or email' });
        continue;
      }

      let found = false;
      let generationPath = null;
      let generationCount = 0;
      let latestGeneration = null;

      try {
        // Sprawdź customer-{customerId}.json
        const customerPath = `customify/system/stats/generations/customer-${customerId}.json`;
        try {
          const blob = await head(customerPath, { token: BLOB_TOKEN }).catch(() => null);
          if (blob && blob.url) {
            const response = await fetch(blob.url);
            if (response.ok) {
              const data = await response.json();
              if (data.generations && Array.isArray(data.generations) && data.generations.length > 0) {
                generationCount = data.generations.length;
                latestGeneration = data.generations[0]; // Najnowsza generacja
                found = true;
                generationPath = customerPath;
              }
            }
          }
        } catch (e) {
          // Nie znaleziono - OK
        }

        // Jeśli nie znaleziono przez customerId, sprawdź email
        if (!found) {
          // Sanityzuj email
          const sanitizedEmail = email.replace(/[^a-z0-9]/g, '-');
          const emailPath = `customify/system/stats/generations/email-${sanitizedEmail}.json`;
          try {
            const blob = await head(emailPath, { token: BLOB_TOKEN }).catch(() => null);
            if (blob && blob.url) {
              const response = await fetch(blob.url);
              if (response.ok) {
                const data = await response.json();
                if (data.generations && Array.isArray(data.generations) && data.generations.length > 0) {
                  generationCount = data.generations.length;
                  latestGeneration = data.generations[0]; // Najnowsza generacja
                  found = true;
                  generationPath = emailPath;
                }
              }
            }
          } catch (e) {
            // Nie znaleziono - OK
          }
        }

        if (found) {
          results.withGenerations.push({
            customerId,
            email,
            generationCount,
            path: generationPath,
            latestGeneration: latestGeneration ? {
              id: latestGeneration.id,
              style: latestGeneration.style,
              imageUrl: latestGeneration.imageUrl || latestGeneration.transformedImage,
              watermarkedImageUrl: latestGeneration.watermarkedImageUrl,
              date: latestGeneration.date || latestGeneration.timestamp
            } : null
          });
        } else {
          results.withoutGenerations.push({ customerId, email });
        }
      } catch (error) {
        results.errors.push({
          customerId,
          email,
          error: error.message
        });
      }

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`⏳ ${i + 1}/${customers.length} - sprawdzam...`);
      }
    }

    console.log(`✅ Znaleziono ${results.withGenerations.length} z generacjami, ${results.withoutGenerations.length} bez generacji`);

    return res.status(200).json({
      success: true,
      total: customers.length,
      withGenerations: results.withGenerations.length,
      withoutGenerations: results.withoutGenerations.length,
      errors: results.errors.length,
      results
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

