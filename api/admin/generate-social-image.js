// api/admin/generate-social-image.js
// HTTP: POST — to samo co utils/generatePersonalizationSocialCore (panel admin / ręczne wywołania).

const {
  generatePersonalizationSocialCore,
  isPersonalizationSocialExcludedProductHandle
} = require('../../utils/generatePersonalizationSocialCore');

const ADMIN_TOKEN = process.env.ADMIN_STATS_TOKEN;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { entryId, productHandle, rocznica, opis, imie, style: styleFromLog, token: bodyToken } = req.body || {};
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '') || bodyToken;
  if (ADMIN_TOKEN && token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!entryId) return res.status(400).json({ error: 'Missing entryId' });
  if (isPersonalizationSocialExcludedProductHandle(productHandle)) {
    return res.status(400).json({
      error:
        'Produkt „dodaj osobę” nie jest używany w socialu — tylko serie kobieta / mężczyzna / ślub.'
    });
  }

  try {
    const socialImageUrl = await generatePersonalizationSocialCore({
      entryId,
      productHandle,
      rocznica,
      opis,
      imie,
      style: styleFromLog
    });
    return res.status(200).json({ ok: true, socialImageUrl });
  } catch (err) {
    console.error('❌ [SOCIAL]', err.message);
    const msg = err.message || 'Social generation failed';
    if (msg.includes('Produkt wyłączony')) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
};
