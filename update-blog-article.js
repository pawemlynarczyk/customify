const SHOP_DOMAIN = 'customify-ok.myshopify.com';
const API_VERSION = '2024-01';

const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ Brak SHOPIFY_ACCESS_TOKEN w środowisku.');
  process.exit(1);
}

const blogHandle = 'poradnik';
const articleHandle = 'prezent-na-walentynki-7-pomyslow-ktore-naprawde-robia-wrazenie';

const articleTitle = 'Prezent na Walentynki: 7 pomysłów, które naprawdę robią wrażenie';
const articleSummary = '7 sprawdzonych pomysłów na prezent walentynkowy + wskazówki wyboru zdjęcia i formatu.';

const articleBody = `
<p><strong>Jeśli szukasz prezentu, który jest osobisty, robi wrażenie i zostaje na lata</strong> — portret ze zdjęcia to jeden z najlepszych wyborów. Poniżej znajdziesz 7 konkretnych pomysłów na walentynkowy prezent oraz krótki poradnik, jak wybrać zdjęcie i format.</p>

<h2>TL;DR – najszybszy wybór</h2>
<ul>
  <li><strong>Romantycznie:</strong> portret boho lub akwarelowy</li>
  <li><strong>Z humorem:</strong> karykatura</li>
  <li><strong>Z efektem “wow”:</strong> portret królewski</li>
  <li><strong>Dla miłośników zwierząt:</strong> portret z pupilem</li>
</ul>

<h2>1) Portret w stylu boho</h2>
<p>Delikatny, ciepły i bardzo „walentynkowy” w charakterze. Dobrze pasuje do nowoczesnych wnętrz i jest bezpiecznym wyborem, jeśli nie znasz idealnie gustu drugiej osoby.</p>

<h2>2) Portret królewski</h2>
<p>Największy efekt „wow”. Świetny dla osób z poczuciem humoru albo dla par, które lubią nietypowe prezenty. To prezent, który naprawdę zapada w pamięć.</p>

<h2>3) Portret z pupilem (np. kot w stylu królewskim)</h2>
<p>Jeśli ukochana osoba kocha zwierzaki — to strzał w 10. Personalizowany portret ze zwierzakiem działa emocjonalnie i wygląda bardzo efektownie.</p>

<h2>4) Karykatura ze zdjęcia</h2>
<p>Lekka i zabawna forma prezentu. Idealna, jeśli chcesz podkreślić wspólne poczucie humoru, ale nadal wręczyć coś eleganckiego i dopracowanego.</p>

<h2>5) Portret minimalistyczny</h2>
<p>Świetny do nowoczesnych mieszkań i dla osób, które lubią prostotę. Minimalizm dobrze wygląda na ścianie i nie dominuje wnętrza.</p>

<h2>6) Portret akwarelowy</h2>
<p>Miękki, artystyczny styl. Daje bardziej „malarski” efekt, idealny jeśli chcesz czegoś subtelnego i romantycznego.</p>

<h2>7) Duży format na ścianę</h2>
<p>Jeśli chcesz, żeby prezent robił wrażenie również w przestrzeni, wybierz większy format. To podkreśla „premium” charakter prezentu.</p>

<h2>Jak wybrać najlepsze zdjęcie?</h2>
<ul>
  <li>Najlepiej sprawdzają się zdjęcia ostre, dobrze oświetlone, bez mocnego filtra.</li>
  <li>Jeśli to portret — twarz powinna być wyraźna i zajmować sporą część kadru.</li>
  <li>Unikaj zdjęć zbyt ciemnych lub bardzo rozmytych.</li>
</ul>

<h2>Kiedy zamówić, żeby zdążyć na Walentynki?</h2>
<p>Im wcześniej, tym lepiej — szczególnie w lutym. Zamówienie z wyprzedzeniem daje spokój i pewność, że prezent dotrze na czas.</p>

<h2>Powiązane produkty</h2>
<p>Zobacz dedykowaną kolekcję walentynkową: <a href="/collections/walentynki">Kolekcja Walentynki</a>.</p>
`;

const request = async (path, options = {}) => {
  const url = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} - ${text}`);
  }

  return response.json();
};

const main = async () => {
  const blogsResponse = await request('/blogs.json?limit=250');
  const blogs = blogsResponse.blogs || [];
  const blog = blogs.find((item) => item.handle === blogHandle);

  if (!blog) {
    throw new Error(`Nie znaleziono bloga o handle: ${blogHandle}`);
  }

  const articlesResponse = await request(`/blogs/${blog.id}/articles.json?limit=250`);
  const articles = articlesResponse.articles || [];
  const article = articles.find((item) => item.handle === articleHandle);

  if (!article) {
    throw new Error(`Nie znaleziono artykułu o handle: ${articleHandle}`);
  }

  const existingTags = (article.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const tagSet = new Set(existingTags);
  tagSet.add('kolekcja:walentynki');
  tagSet.add('walentynki');

  const updatePayload = {
    article: {
      id: article.id,
      title: articleTitle,
      body_html: articleBody.trim(),
      summary_html: articleSummary,
      tags: Array.from(tagSet).join(', ')
    }
  };

  await request(`/articles/${article.id}.json`, {
    method: 'PUT',
    body: JSON.stringify(updatePayload)
  });

  console.log('✅ Zaktualizowano artykuł:', articleTitle);
};

main().catch((error) => {
  console.error('❌ Błąd aktualizacji artykułu:', error.message);
  process.exit(1);
});
