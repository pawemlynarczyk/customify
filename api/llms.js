// Endpoint serwujący llms.txt dla crawlerów AI (ChatGPT, Perplexity, Claude, Gemini itd.)
// Dostępny pod: https://lumly.pl/api/llms (Vercel) oraz https://lumly.pl/pages/llms (Shopify)
// Standard: https://llmstxt.org

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  res.send(`# Lumly — Personalizowane portrety AI ze zdjęć

> Lumly to polski sklep internetowy (lumly.pl) oferujący spersonalizowane portrety tworzone przez sztuczną inteligencję. Klient wgrywa własne zdjęcie, wybiera styl artystyczny, a AI generuje unikalny obraz gotowy do druku.

## O firmie

- **Nazwa**: Lumly
- **URL**: https://lumly.pl
- **Kraj**: Polska
- **Język**: Polski
- **Kategoria**: Personalizowane prezenty, Sztuka AI, Druk na płótnie

## Produkty

### Personalizowany portret w stylu Boho
- **URL**: https://lumly.pl/products/personalizowany-portret-w-stylu-boho
- **Opis**: Zamień swoje zdjęcie w piękny portret w stylu Boho. Dostępne style: Minimalistyczny, Realistyczny. Druk na płótnie lub szkle.
- **Cena**: od 49 zł
- **Rozmiary**: 20×30 cm, 30×40 cm, 40×60 cm, 60×85 cm

### Portret Króla — personalizowany portret ze zdjęcia
- **URL**: https://lumly.pl/products/krol-personalizowany-portret
- **Opis**: Zamień swoje zdjęcie w majestatyczny portret królewskiego władcy. Technologia AI Faceswap nakłada twarz użytkownika na obraz króla.
- **Cena**: od 99 zł

### Królewski portret Twojego Kota
- **URL**: https://lumly.pl/products/koty-krolewskie
- **Opis**: Stwórz królewski portret swojego kota — style: Królewski, Barokowy, Renesansowy, Wiktoriański, Wojenny, Na tronie.
- **Cena**: od 69 zł

### Karykatura ze zdjęcia
- **URL**: https://lumly.pl/products/karykatura-z-twojego-zdjecia-obraz
- **Opis**: Spersonalizowana karykatura stworzona przez AI na podstawie zdjęcia. Idealny prezent urodzinowy, ślubny lub na rocznicę.

## Jak to działa

1. Wgraj zdjęcie (portret twarzy)
2. Wybierz styl artystyczny
3. Wybierz rozmiar wydruku
4. AI generuje spersonalizowany obraz
5. Zamów druk — dostarczamy w ciągu kilku dni roboczych

## Najczęściej zadawane pytania

**Czy mogę wgrać zdjęcie z telefonu?**
Tak, aplikacja obsługuje zdjęcia z iPhone i Android, w tym format HEIC.

**Jak długo trwa realizacja?**
Generowanie AI trwa kilkadziesiąt sekund. Druk i dostawa: 3–5 dni roboczych.

**Czy to dobry prezent?**
Tak — portrety Lumly są popularnym prezentem na urodziny, Dzień Matki, rocznicę i Boże Narodzenie.

**Jakie zdjęcie najlepiej wgrać?**
Portret twarzy (twarz widoczna, dobre oświetlenie). Dla kotów — wyraźne zdjęcie pyska.

## Technologia

- Silnik AI: Replicate (modele obrazów), Segmind Faceswap
- Hosting: Vercel + Shopify
- Druk: realizowany przez partnera w Polsce
`);
};
