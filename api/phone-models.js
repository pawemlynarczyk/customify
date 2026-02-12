// Dane osadzone - TYLKO dla etui (personalizowane-etui-na-telefon-z-twoim-zdjeciem)
const phoneModelsData = {
  version: 1,
  brands: [
    { id: 'apple', name: 'Apple' },
    { id: 'samsung', name: 'Samsung' },
    { id: 'xiaomi', name: 'Xiaomi' },
    { id: 'huawei', name: 'Huawei' },
    { id: 'oppo', name: 'OPPO' },
    { id: 'oneplus', name: 'OnePlus' },
    { id: 'google', name: 'Google' },
    { id: 'motorola', name: 'Motorola' },
    { id: 'nokia', name: 'Nokia' },
    { id: 'sony', name: 'Sony' },
    { id: 'honor', name: 'Honor' },
    { id: 'realme', name: 'realme' },
    { id: 'poco', name: 'POCO' },
    { id: 'asus', name: 'ASUS' }
  ],
  models: {
    apple: [
      { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max' },
      { id: 'iphone-16-pro', name: 'iPhone 16 Pro' },
      { id: 'iphone-16-plus', name: 'iPhone 16 Plus' },
      { id: 'iphone-16', name: 'iPhone 16' },
      { id: 'iphone-15-pro-max', name: 'iPhone 15 Pro Max' },
      { id: 'iphone-15-pro', name: 'iPhone 15 Pro' },
      { id: 'iphone-15-plus', name: 'iPhone 15 Plus' },
      { id: 'iphone-15', name: 'iPhone 15' },
      { id: 'iphone-14-plus', name: 'iPhone 14 Plus' },
      { id: 'iphone-14', name: 'iPhone 14' },
      { id: 'iphone-13-pro-max', name: 'iPhone 13 Pro Max' },
      { id: 'iphone-13-pro', name: 'iPhone 13 Pro' },
      { id: 'iphone-13-mini', name: 'iPhone 13 mini' },
      { id: 'iphone-13', name: 'iPhone 13' },
      { id: 'iphone-12-pro-max', name: 'iPhone 12 Pro Max' },
      { id: 'iphone-12-pro', name: 'iPhone 12 Pro' },
      { id: 'iphone-12-mini', name: 'iPhone 12 mini' },
      { id: 'iphone-12', name: 'iPhone 12' },
      { id: 'iphone-se-3', name: 'iPhone SE (3. generacja)' },
      { id: 'iphone-se-2', name: 'iPhone SE (2. generacja)' }
    ],
    samsung: [
      { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra' },
      { id: 'galaxy-s24-plus', name: 'Galaxy S24+' },
      { id: 'galaxy-s24', name: 'Galaxy S24' },
      { id: 'galaxy-s23-ultra', name: 'Galaxy S23 Ultra' },
      { id: 'galaxy-s23-plus', name: 'Galaxy S23+' },
      { id: 'galaxy-s23', name: 'Galaxy S23' },
      { id: 'galaxy-s22-ultra', name: 'Galaxy S22 Ultra' },
      { id: 'galaxy-s22-plus', name: 'Galaxy S22+' },
      { id: 'galaxy-s22', name: 'Galaxy S22' },
      { id: 'galaxy-s21', name: 'Galaxy S21' },
      { id: 'galaxy-z-fold5', name: 'Galaxy Z Fold 5' },
      { id: 'galaxy-z-fold4', name: 'Galaxy Z Fold 4' },
      { id: 'galaxy-z-flip5', name: 'Galaxy Z Flip 5' },
      { id: 'galaxy-z-flip4', name: 'Galaxy Z Flip 4' },
      { id: 'galaxy-a54', name: 'Galaxy A54' },
      { id: 'galaxy-a53', name: 'Galaxy A53' },
      { id: 'galaxy-a34', name: 'Galaxy A34' },
      { id: 'galaxy-a33', name: 'Galaxy A33' }
    ],
    xiaomi: [
      { id: '14-ultra', name: 'Xiaomi 14 Ultra' },
      { id: '14-pro', name: 'Xiaomi 14 Pro' },
      { id: '14', name: 'Xiaomi 14' },
      { id: '13t-pro', name: 'Xiaomi 13T Pro' },
      { id: '13t', name: 'Xiaomi 13T' },
      { id: '13', name: 'Xiaomi 13' },
      { id: 'redmi-note-13-pro', name: 'Redmi Note 13 Pro' },
      { id: 'redmi-note-13', name: 'Redmi Note 13' },
      { id: 'redmi-note-12-pro', name: 'Redmi Note 12 Pro' },
      { id: 'redmi-note-12', name: 'Redmi Note 12' }
    ],
    huawei: [
      { id: 'mate-60-pro', name: 'Mate 60 Pro' },
      { id: 'mate-60', name: 'Mate 60' },
      { id: 'p60-pro', name: 'P60 Pro' },
      { id: 'p60', name: 'P60' },
      { id: 'p50-pro', name: 'P50 Pro' },
      { id: 'nova-12', name: 'Nova 12' },
      { id: 'nova-11', name: 'Nova 11' }
    ],
    oppo: [
      { id: 'find-x7-ultra', name: 'Find X7 Ultra' },
      { id: 'find-x7', name: 'Find X7' },
      { id: 'find-x6-pro', name: 'Find X6 Pro' },
      { id: 'reno-11-pro', name: 'Reno 11 Pro' },
      { id: 'reno-10-pro', name: 'Reno 10 Pro' },
      { id: 'reno-9', name: 'Reno 9' }
    ],
    oneplus: [
      { id: '12', name: 'OnePlus 12' },
      { id: '11', name: 'OnePlus 11' },
      { id: 'nord-3', name: 'Nord 3' },
      { id: 'nord-2', name: 'Nord 2' }
    ],
    google: [
      { id: 'pixel-9-pro-xl', name: 'Pixel 9 Pro XL' },
      { id: 'pixel-9-pro', name: 'Pixel 9 Pro' },
      { id: 'pixel-9', name: 'Pixel 9' },
      { id: 'pixel-8-pro', name: 'Pixel 8 Pro' },
      { id: 'pixel-8', name: 'Pixel 8' },
      { id: 'pixel-7-pro', name: 'Pixel 7 Pro' },
      { id: 'pixel-7', name: 'Pixel 7' }
    ],
    motorola: [
      { id: 'edge-40-pro', name: 'Edge 40 Pro' },
      { id: 'edge-40', name: 'Edge 40' },
      { id: 'razr-40-ultra', name: 'Razr 40 Ultra' },
      { id: 'g84', name: 'Moto G84' }
    ],
    nokia: [
      { id: 'g42', name: 'Nokia G42' },
      { id: 'g22', name: 'Nokia G22' }
    ],
    sony: [
      { id: 'xperia-1-v', name: 'Xperia 1 V' },
      { id: 'xperia-5-v', name: 'Xperia 5 V' },
      { id: 'xperia-10-v', name: 'Xperia 10 V' }
    ],
    honor: [
      { id: 'magic6-pro', name: 'Magic 6 Pro' },
      { id: 'magic5-pro', name: 'Magic 5 Pro' },
      { id: '90', name: 'Honor 90' }
    ],
    realme: [
      { id: 'gt5-pro', name: 'Realme GT 5 Pro' },
      { id: '11-pro-plus', name: 'Realme 11 Pro+' },
      { id: '11-pro', name: 'Realme 11 Pro' }
    ],
    poco: [
      { id: 'f6-pro', name: 'POCO F6 Pro' },
      { id: 'f5', name: 'POCO F5' },
      { id: 'x6-pro', name: 'POCO X6 Pro' }
    ],
    asus: [
      { id: 'rog-phone-8', name: 'ROG Phone 8' },
      { id: 'zenfone-11-ultra', name: 'Zenfone 11 Ultra' }
    ]
  }
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(phoneModelsData);
};
