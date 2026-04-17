/**
 * Odtwarza getProductTypeFromStyle() ze sklepu (public/customify.js)
 * Używa pseudo-ścieżki /products/{handle} zamiast window.location.
 * Źródło: linie 3655–4013 customify.js — przy zmianie mapowania zsynchronizuj ręcznie.
 */
function getProductTypeFromPseudoUrl(handle, style) {
    // 🎯 PRIORYTET 1: Sprawdź URL strony (NAJWAŻNIEJSZE - określa cenę!)
    const currentUrl = `/products/${String(handle || '').toLowerCase()}`;
    // Mapuj URL → productType (określa który produkt Shopify = jaka cena)
    if (currentUrl.includes('krol-portret') || currentUrl.includes('krol-personalizowany') || currentUrl.includes('portret-krola-polski')) {
            return 'king';
    }
    if (currentUrl.includes('koty-krolewskie') || currentUrl.includes('krolewskie-portrety-kotow')) {
            return 'cats';
    }
    if (currentUrl.includes('obraz-w-stylu-pop-art-z-twojego-zdjecia-personalizowany-na-prezent')) {
            return 'pop_art';
    }

    if (currentUrl.includes('personalizowany-obraz-3d-cartoon-ilustracja-z-twojego-zdjecia')) {
            return '3d_cartoon';
    }

    if (currentUrl.includes('portret-z-efektem-farb-olejnych-z-twojego-zdjecia-na-prezent')) {
            return 'oil_paints';
    }

    if (currentUrl.includes('obraz-olejny-portret-na-plotnie-z-twojego-zdjecia')) {
            return 'oil_painting';
    }

    if (currentUrl.includes('obraz-ze-zdjecia-personalizowany-prezent-dla-niej-akwarela')) {
      console.log('🎨 [PRODUCT-TYPE] URL = Prezent dla Niej (Farby Olejne) → productType: oil_paints');
      return 'oil_paints';
    }
    if (currentUrl.includes('personalizowany-portret-w-stylu-boho')) {
            return 'boho';
    }
    if (currentUrl.includes('superbohater') || currentUrl.includes('portret-ze-zdjecia-superbohater-prezent-dla-chlopca')) {
            return 'superhero';
    }
    if (currentUrl.includes('plakat-ze-zdjecia-w-stylu-komiks')) {
      console.log('🖍️ [PRODUCT-TYPE] URL = Komiks (test) → productType: caricature-new');
      return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-pary-na-50-ta-rocznice-wydruk-na-szkle')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-na-50-ta-rocznice')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-biznes-woman-personalizowany-prezent')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('wydruk-na-szkle-biznes-woman-prezent-na-urodziny-dla-kobiety')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-50-urodziny-dla-kobiety-biznes-woman')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-30-urodziny-dla-kobiety-biznes-woman')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-zainteresowania')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-policjantka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-rolniczka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-lekarka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-podrozniczka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-psycholog')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-kucharka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-fitness')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-dla-niej-szefowa')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-rolnik-ze-zdjecia-personalizowany-prezent-dla-mezczyzny')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-polskiego-rolnika-z-ciagnikiem-prezent-z-charakterem')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-mechanika-samochodowego-ze-zdjecia-personalizowany-prezent-dla-dziadka-taty-lub-brata')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('motocyklista-karykatura-ze-zdjecia-personalizowany-prezent-dla-niego')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-dla-chlopca-pilkarz')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('fotoobraz-strazaka-ze-zdjecia-prezent-na-35-urodziny-dla-meza')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-dla-lekarza-personalizowany-plakat-na-urodziny-dla-chlopaka')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('prezent-ze-zdjecia-dla-budowlanca-personalizowany-obraz-dla-taty')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('prezent-z-wlasnym-zdjeciem-dla-kierowcy-tira-personalizowany-obraz')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-policjant-prezent-dla-faceta')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-karykatura-szefa')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-pary-na-diamentowe-gody-ze-zdjecia-60-rocznica-slubu')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-dziadkow-ze-zdjecia-wesola-para-personalizowany-prezent')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-pary-podroznikow-ze-zdjecia-personalizowany-prezent-dla-pary')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-slubna-ze-zdjecia-prezent-dla-mlodej-pary')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-na-rocznice-slubu-prezent-na-25-30-40-50-lecie')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-na-50-rocznice-slubu-prezent-na-50-lecie')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-na-40-rocznice-slubu-obraz-ze-zdjecia-na-40-lecie')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-wedkarz-portret-ze-zdjecia-personalizowany-prezent-dla-faceta')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('karykatura-pilkarza-ze-zdjecia-personalizowany-obraz-dla-chlopaka-dziadka-taty')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('kulturysta-karykatura-ze-zdjecia-prezent-dla-mezczyzny')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('active-woman-portret-ze-zdjecia-na-rocznice-dla-kolezanki-kobiety-druk-na-szkle')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('active-woman-portret-ze-zdjecia-na-18-urodziny-dla-dziewczyny-druk-na-szkle-copy')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-prezent-na-urodziny-dla-kolezanki-szefowej-salon-spa')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-prezent-na-40-urodziny-dla-kobiety-czerwony-dywan')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('portret-na-18-urodziny-dla-dziewczyny-magic-z-wlasnego-zdjecia-druk-na-szkle')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('portret-ze-zdjecia-na-30-rocznice-dla-nauczycielki-karykatura-na-prezent')) {
            return 'caricature-new';
    }
    if (currentUrl.includes('portret-pary-z-okazji-rocznicy-z-twojego-zdjecia')) {
            return 'para_krolewska';
    }
    if (currentUrl.includes('portret-pary-w-stylu-anime-obraz-ze-zdjecia')) {
            return 'anime';
    }
    if (currentUrl.includes('ramka-spotify') || currentUrl.includes('zdjecie-na-szkle-ramka-spotify')) {
            return 'spotify_frame';
    }
    if (currentUrl.includes('personalizowane-etui-na-telefon-z-twoim-zdjeciem') && !currentUrl.includes('-karykatura')) {
            return 'etui';
    }
    if (currentUrl.includes('portret-z-twojego-zdjecia-neon-lights-dla-dziewczyny-prezent')) {
            return 'neo';
    }
    if (currentUrl.includes('personalizowany-obraz-z-twojego-zdjecia-dla-mezczyzny-w-stylu-western-wanted')) {
            return 'wanted';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-dla-kobiety-w-stylu-western-wanted-poszukiwana')) {
      console.log('🤠 [PRODUCT-TYPE] URL = Western Wanted (kobieta) → productType: wanted_k');
      return 'wanted_k';
    }
    if (currentUrl.includes('portret-superbohater-obraz-na-plotnie-z-twojego-zdjecia-superman')) {
            return 'superman';
    }
    if (currentUrl.includes('portret-dziecka-w-stroju-jednorozca') || currentUrl.includes('jednorozec')) {
            return 'unicorn';
    }
    if (currentUrl.includes('portret-dziecka-w-stroju-misia') || currentUrl.includes('mis')) {
            return 'teddy_bear';
    }
    if (currentUrl.includes('portret-ze-zdjecia-dla-dziewczynki-zimowa-ksiezniczka') || currentUrl.includes('zimowa-ksiezniczka')) {
            return 'winter_princess';
    }
    if (currentUrl.includes('obraz-ze-zdjecia-krolowa-sniegu') || currentUrl.includes('krolowa-sniegu')) {
            return 'snow_queen';
    }
    if (currentUrl.includes('portret-krolowej-obraz-ze-zdjecia-prezent-dla-niej')) {
            return 'queen_prezent';
    }
    if (currentUrl.includes('prezent-na-walentynki-obraz-na-plotnie-z-twojego-zdjecia')) {
            return 'love_rose';
    }
    if (currentUrl.includes('portret-zakochana-para-krolewska-prezent-na-walentynki-personalizowany')) {
            return 'royal_love';
    }
    if (currentUrl.includes('prezent-na-walentynki-superpara-obraz-na-plotnie-z-twojego-zdjecia')) {
            return 'superpara';
    }
    if (currentUrl.includes('portret-w-stylu-gta-obraz-na-plotnie-z-twojego-zdjecia-super-prezent') || currentUrl.includes('portret-w-stylu-gta')) {
            return 'gta';
    }
    if (currentUrl.includes('portret-w-stylu-hip-hop-obraz-na-plotnie') || currentUrl.includes('portret-ze-zdjecia-hip-hop')) {
            return 'hiphop';
    }
    if (currentUrl.includes('dodaj-osobe-do-zdjecia-naturalny-efekt')) {
            return 'dodaj_osobe';
    }
    if (currentUrl.includes('prezent-dla-dziadkow-retusz-starych-zdjec')) {
            return 'retusz_starych_zdjec';
    }
    if (currentUrl.includes('szkic-ze-zdjecia-obraz-na-plotnie-plakat-ramka')) {
            return 'szkic_olowek';
    }

    // 🔄 PRIORYTET 2: Fallback - sprawdź styl (tylko dla starych generacji bez URL)
        const styleToProductType = {
      'pop-art': 'pop_art',
      '3d-cartoon': '3d_cartoon',
      'oil-paints': 'oil_paints',
      'oil-painting': 'oil_painting',
      'minimalistyczny': 'boho',
      'realistyczny': 'boho',
      'krol-krolewski': 'king',
      'krol-majestatyczny': 'king',
      'krol-triumfalny': 'king',
      'krol-imponujacy': 'king',
      'krol-polski': 'king',
      'krol-polski-krolewski': 'king',
      'krolowa-styl-1': 'queen',
      'krolowa-styl-2': 'queen',
      'krolowa-styl-3': 'queen',
      'krolowa-styl-4': 'queen',
      'krolowa-prezent-1': 'queen_prezent',
      'krolowa-prezent-2': 'queen_prezent',
      'krolewski': 'cats',
      'na-tronie': 'cats',
      'wojenny': 'cats',
      'wiktorianski': 'cats',
      'renesansowy': 'cats',
      'zamkowy': 'para_krolewska',
      'krolewski-para': 'para_krolewska',
      'superhero_kid': 'superhero',
      'superhero_boy': 'superhero',
      'karykatura': 'caricature',
      'caricature-new': 'caricature-new',
      'karykatura-olowek': 'caricature-new',
      'karykatura-prezent-szkic': 'caricature-new',
      'olowkiem-zam-karykatura': 'caricature',
      'olowkiem-zam-nowoczesna': 'caricature-new',
      'olowkiem-zam-szkic': 'caricature-new',
      'watercolor_ok': 'caricature-new',
      'swieta': 'caricature-new',
      'swieta_2': 'caricature-new',
      'akwarela': 'watercolor',
      'openai-art': 'openai-art', // OpenAI GPT-Image-1 style
      'love-rose': 'love_rose', // Love Rose - OpenAI GPT-Image-1.5 via Replicate
      'royal-love': 'royal_love', // Royal Love - OpenAI GPT-Image-1.5 via Replicate
      'gta': 'gta', // GTA - OpenAI GPT-Image-1.5 via Replicate
      'hiphop': 'hiphop', // Hip-Hop - OpenAI GPT-Image-1.5 via Replicate
      'szkic-love': 'szkic_love', // Szkic Love - OpenAI GPT-Image-1.5 via Replicate
      'jak-z-bajki': 'jak_z_bajki', // Jak z bajki - OpenAI GPT-Image-1.5 via Replicate
      'superpara': 'superpara', // Superpara - OpenAI GPT-Image-1.5 via Replicate
      'jednorozec': 'unicorn',
      'mis': 'teddy_bear',
      'zimowa-ksiezniczka': 'winter_princess',
      'krolowa-sniegu': 'snow_queen',
      'neo': 'neo',
      'wanted': 'wanted',
      'wanted_k': 'wanted_k',
      'anime': 'anime',
      'superman': 'superman',
      'dodaj-osobe': 'dodaj_osobe',
      'retusz-starych-zdjec': 'retusz_starych_zdjec',
      'szkic-olowek': 'szkic_olowek'
    };

    const productType = styleToProductType[style] || 'other';
        return productType;
}

module.exports = { getProductTypeFromPseudoUrl };
