/**
 * Płeć do kroku 1 social (flux placeholder): priorytet pole „imię / dedykacja”.
 * — dwa rozpoznane imiona → para
 * — jedno → męskie / żeńskie wg list + heurystyka (-a)
 */

function foldRaw(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
}

const STOP = new Set(
  'dla kocha z na okazji wszystkiego najlepszego wszystkiego kochanie kochana kochany moja moj naszej naszym rodzicom rodzice rodzinie zyczenia gratulacje'
    .split(/\s+/)
    .map(w => foldRaw(w))
);

/** Formy podstawowe + częste odmiany — klucze zbiorów po foldRaw (ASCII) */
const FEMALE = new Set(
  `
  agata agaty agacie agatko
  agnieszka agnieszki agnieszce agnieszko
  aleksandra aleksandry oliwia ola oli
  alicja alicji alicjo
  amelia amelii amelio
  anastazja anastazji
  andżelika angelika
  anna anny annie aniu ania ani asia
  barbara barbary basia
  beata beaty beacie
  bożena bożeny bożeno
  celina celiny
  dagmara dagmary
  danuta danuty
  dorota doroty dorocie
  edyta edyty
  eliza elizy
  elżbieta elżbiety eli ela
  emilia emilii emilio
  ewa ewy ewie ewu
  gabriela gabrieli gabi
  grażyna grażyny
  halina haliny
  hanna hanny hania
  helena heleny
  ilona ilony
  iwona iwony
  izabela izabeli bela
  jagoda jagody
  joanna joanny joasi asi
  jolanta jolanty jolu
  julia juli julko
  justyna justyny
  kamila kamili
  karina kariny
  karolina karoliny
  katarzyna katarzyny kasiu kasia kathy
  kinga kingi
  klaudia klaudii
  krystyna krystyny
  laura laury
  lena leny
  lucyna lucyny
  magdalena magdaleny magda madziu
  malgorzata malgorzaty gosia gosi małgorzata małgorzaty
  maria marii marysiu marysia
  marina mariny
  martyna martyny
  marta marty marto
  michalina michaliny
  monika moniki moniko
  natalia natalii natalko
  nikola nikoli
  oliwia oliwii
  patrycja patrycji
  paulina pauliny
  renata renaty
  roksana roksany
  sylwia sylwii
  teresa teresy
  urszula urszuli
  weronika weroniki
  wiktoria wiktorii wiki
  zofia zofii zosi zośka
  zuzanna zuzanny zuzia
  `
    .split(/\s+/)
    .map(s => s.replace(/[()_]/g, '').trim())
    .filter(Boolean)
    .map(foldRaw)
);

const MALE = new Set(
  `
  adam adama adasiu adas
  aleksander olek
  andrzej andrzeja jedrek
  artur artura
  bartek bartka bartosz bartosza
  bogdan bogdana
  bogumil
  czeslaw czeslawa
  damian damiana
  dawid dawida
  dominik
  edward edwarda
  emil emilem
  eryk eryka
  filip filipa
  franciszek franka franek
  gabriel
  grzegorz grzegorza
  henryk henryka
  hubert huberta
  ireneusz ireneusza
  jakub kuba jakuba
  jan jana janka john
  janusz janusza
  jaroslaw jaroslawa jarek
  jerzy jerzego
  jozef jozefa joe
  kamil kamilem
  karol karola
  konrad konrada
  krzysztof krzysztofa kris
  leszek leszka
  lucjan lucjana
  lukasz luke
  maciej macieja
  marcin marcina
  marek marka
  marian mariana
  mateusz mateusza mati
  michal michala
  mikolaj mikolaja
  norbert norberta
  olek alek aleks
  patryk patryka
  pawel pawla
  piotr piotra pete
  przemyslaw przemka
  rafal rafala
  robert roberta
  ryszard ryszarda
  sebastian sebastiana
  slawomir slawomira
  stanislaw stanislawa staszek
  szczepan szczepana
  szymon szymona
  tomasz tomka tomek
  tadeusz tadeusza
  waldemar waldemara
  wiktor wiktora
  wojciech wojtka wojciecha
  zbigniew zbigniewa zbyszek
  zenon zenona
  barnaba barnaby
  kosma kosmy
  oliwier oliwiera
  `
    .split(/\s+/)
    .map(s => s.replace(/[()_]/g, '').trim())
    .filter(Boolean)
    .map(foldRaw)
);

/** Męskie imiona na -a (heurystyka „-a = kobieta” nie dotyczy) */
const MALE_ENDING_A = new Set(['barnaba', 'kosma', 'kuba', 'luca', 'bonawentura', 'juda', 'micha', 'michal']);

function fold(s) {
  return foldRaw(s);
}

function splitImieSegments(raw) {
  const s = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return [];
  return s
    .split(
      /\s+(?:i|oraz|and)\s+|[,;/|]\s*|\s*\+\s*|\s*&\s*|\s+-\s+/i
    )
    .map(p => p.trim())
    .filter(Boolean);
}

/** Słowa wyglądające na token imienia (bez interpunkcji) */
function wordsFromSegment(seg) {
  return String(seg)
    .split(/\s+/)
    .map(w => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter(w => w.length >= 2);
}

function namesFromSegment(seg) {
  const ws = wordsFromSegment(seg);
  const found = [];
  for (const w of ws) {
    const f = fold(w);
    if (STOP.has(f)) continue;
    if (MALE.has(f) || FEMALE.has(f)) {
      found.push(f);
    }
  }
  return found;
}

/**
 * @returns {'man'|'woman'|'couple'|null}
 */
function inferPhotorealGenderFromImie(imieRaw) {
  const raw = String(imieRaw || '').trim();
  if (!raw) return null;

  const segments = splitImieSegments(raw);
  const allKnown = [];

  for (const seg of segments) {
    allKnown.push(...namesFromSegment(seg));
  }

  if (allKnown.length >= 2) {
    return 'couple';
  }

  if (allKnown.length === 1) {
    const n = allKnown[0];
    if (FEMALE.has(n) && !MALE.has(n)) return 'woman';
    if (MALE.has(n) && !FEMALE.has(n)) return 'man';
    if (MALE.has(n) && FEMALE.has(n)) return 'woman';
  }

  // Dwa segmenty (np. „Kamil i Ola”) — para nawet gdy drugie imię nie jest na liście
  if (segments.length >= 2) {
    const heads = [];
    for (const seg of segments) {
      const ws = wordsFromSegment(seg).filter(w => !STOP.has(fold(w)));
      if (!ws.length) continue;
      const primary =
        ws.find(w => MALE.has(fold(w)) || FEMALE.has(fold(w))) || ws[0];
      heads.push(fold(primary));
    }
    if (heads.length >= 2) return 'couple';
  }

  // Fallback: jeden segment, jedno słowo — heurystyka końcówki -a
  if (segments.length === 1) {
    const ws = wordsFromSegment(segments[0]).filter(w => !STOP.has(fold(w)));
    if (ws.length === 1) {
      const f = fold(ws[0]);
      if (f.endsWith('a') && f.length >= 3 && !MALE_ENDING_A.has(f)) return 'woman';
      return 'man';
    }
  }

  return null;
}

module.exports = {
  inferPhotorealGenderFromImie,
  fold,
  splitImieSegments
};
