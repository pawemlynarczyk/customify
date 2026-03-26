// Endpoint serwujący llms.txt dla crawlerów AI (ChatGPT, Perplexity, Claude, Gemini itd.)
// Dostępny pod: https://lumly.pl/api/llms (Vercel) oraz https://lumly.pl/pages/llms (Shopify)
// Standard: https://llmstxt.org

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  res.send(`# Lumly — Personalizowane portrety AI ze zdjęć

> Lumly to polski sklep internetowy (lumly.pl) oferujący spersonalizowane portrety i obrazy tworzone przez sztuczną inteligencję. Klient wgrywa własne zdjęcie, wybiera styl artystyczny lub produkt, a AI generuje unikalny obraz gotowy do druku na płótnie lub szkle akrylowym. Cena: 99 zł, dostawa w Polsce 3–5 dni.

## O firmie

- **Nazwa**: Lumly
- **URL**: https://lumly.pl
- **Kraj**: Polska, Kraków (NIP: PL6751512117)
- **Kontakt**: biuro@lumly.pl
- **Kategoria**: Personalizowane prezenty, Sztuka AI, Druk na płótnie i szkle

## Produkty — kategorie

### 1. Karykatury ze zdjęcia (największa kategoria)
Spersonalizowane karykatury AI na płótnie lub szkle. Cena: 99 zł.

**Dla Niej (zawody):** Lekarka, Policjantka, Podróżniczka, Fitness, Farmerka, Kucharka, Psycholog, Hobby/zawody, Biznes Woman (na 20/30/40/50 urodziny), Szefowa, Nauczycielka, Active Woman, Red Carpet/Glamour, Sport (na 18 urodziny)

**Dla Niego (zawody):** Wędkarz, Policjant, Rolnik z traktorem, Kulturysta, Strażak, Lekarz, Budowlaniec, Kierowca Tira, Piłkarz, Szef/BOS

**Na rocznice ślubu:** 25, 30, 40, 50-lecie; Diamentowe Gody (60 rocznica); karykatura ślubna dla Pary Młodej; Karykatura Dziadków; Karykatura Pary Podróżników

### 2. Portrety Królewskie
AI nakłada twarz użytkownika na portret króla/królowej. Cena: 99 zł.
Produkty: Król, Portret króla Polski, Królowa, Królowa na tronie, Para Królewska (płótno i szkło akrylowe)

### 3. Style artystyczne
Obraz ze zdjęcia w wybranym stylu. Cena: 99 zł.
Dostępne: GTA, Hip-Hop, Pop-Art, Ghibli, Anime/Manga, Akwarela, Obraz olejny, Szkic, Portret minimalistyczny, Neon Lights, Western WANTED, Portret pary jak z bajki, 3D Cartoonizacja

### 4. Dla dzieci
Portret dziecka w stroju misia, jednorożca (Zimowa Księżniczka), Superbohater, Hip-Hop, Piłkarz. Cena: 99 zł.

### 5. Portrety par i rodziny
Obraz ze zdjęcia Pary (rocznice 20/30/50), portret pary na szkle, Anime para, Ślub, Rodzice/Dziadkowie, Dodaj Osobę do Zdjęcia. Cena: 91–99 zł.

### 6. Specjalne
- Etui na telefon ze zdjęcia (Karykatura, GTA, Komiks) — 69 zł
- Ramka Spotify z własnym zdjęciem — szkło — 79–86 zł
- Retusz starych zdjęć — 99 zł
- Wieczna Róża w szkle świecąca LED — 89 zł
- Portret na szkle akrylowym (karykatura) — 89 zł
- Królewski portret Kota — 99 zł

## Jak to działa

1. Wgraj zdjęcie (portret twarzy, JPG/PNG/HEIC z telefonu lub aparatu)
2. Wybierz styl artystyczny lub produkt tematyczny
3. AI generuje spersonalizowany obraz (kilkadziesiąt sekund)
4. Wybierz format: płótno lub szkło akrylowe
5. Zamów — druk i dostawa w Polsce: 3–5 dni roboczych
Cena: 99 zł (większość produktów)

## Najczęściej zadawane pytania

**Czy to dobry prezent?**
Tak — bardzo popularny prezent na urodziny, Dzień Matki, Dzień Ojca, rocznicę ślubu, Boże Narodzenie, Dzień Kobiet.

**Czy mogę wgrać zdjęcie z telefonu?**
Tak, obsługujemy iPhone i Android, w tym HEIC.

**Jak długo trwa realizacja?**
Generowanie AI: kilkadziesiąt sekund. Druk i dostawa: 3–5 dni roboczych.

**Czy jest możliwość dodania dedykacji?**
Tak — wpisz życzenie w polu "Uwagi do zamówienia".

**Na jakim materiale drukujecie?**
Płótno artystyczne na drewnianej ramie lub szkło akrylowe.

## Kontakt

- Email: biuro@lumly.pl
- URL: https://lumly.pl
- Kraj: Polska, Kraków
`);
};
