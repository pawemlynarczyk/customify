# 🛡️ IMAGE HASH LIMIT - INSTRUKCJA

## 📋 **CO TO JEST?**

**Image Hash Limit** to zabezpieczenie przed abuse polegającym na używaniu tego samego zdjęcia wielokrotnie przez różne konta/urządzenia/IP.

### **Jak działa:**
1. System oblicza **SHA-256 hash** z zawartości obrazka
2. Sprawdza w Vercel KV ile razy ten hash był użyty
3. Jeśli >= 2 razy → **BLOKADA** (permanentna)
4. Ten sam obrazek = ten sam hash (niezależnie od konta/IP/device)

**⚠️ UWAGA:** Limit został zmieniony z 4 na 2 generacje per obrazek

---

## 🎛️ **JAK WŁĄCZYĆ/WYŁĄCZYĆ?**

### **WŁĄCZENIE (Vercel Dashboard):**

1. Wejdź na: https://vercel.com/pawemlynarczyks-projects/customify
2. **Settings** → **Environment Variables**
3. **Add New**:
   - **Name:** `ENABLE_IMAGE_HASH_LIMIT`
   - **Value:** `true`
   - **Environments:** Production, Preview, Development (zaznacz wszystkie)
4. **Save**
5. **Redeploy** aplikację (opcjonalnie - auto-redeploy po zmianie env)

### **WYŁĄCZENIE (Vercel Dashboard):**

**Opcja 1: Zmień wartość**
1. Wejdź na: https://vercel.com/pawemlynarczyks-projects/customify
2. **Settings** → **Environment Variables**
3. Znajdź `ENABLE_IMAGE_HASH_LIMIT`
4. **Edit** → Zmień na `false`
5. **Save**

**Opcja 2: Usuń zmienną**
1. Wejdź na: https://vercel.com/pawemlynarczyks-projects/customify
2. **Settings** → **Environment Variables**
3. Znajdź `ENABLE_IMAGE_HASH_LIMIT`
4. **Delete**
5. **Potwierdź**

**WAŻNE:** Brak zmiennej = feature wyłączona (domyślnie)

---

## 🧪 **JAK TESTOWAĆ?**

### **TEST 1: Feature wyłączona (domyślnie)**

```bash
# Sprawdź logi Vercel
vercel logs customify-s56o.vercel.app --follow | grep IMAGE-HASH

# Oczekiwany output:
ℹ️ [IMAGE-HASH] Feature disabled (ENABLE_IMAGE_HASH_LIMIT=undefined)
```

### **TEST 2: Feature włączona - ten sam obrazek 3 razy**

```bash
# Feature domyślnie WŁĄCZONA (nie wymaga env variable)

# Upload tego samego zdjęcia 3 razy (różne konta/przeglądarki)

# Sprawdź logi:
vercel logs customify-s56o.vercel.app --follow | grep IMAGE-HASH

# Oczekiwany output dla 1-2 generacji:
🔍 [IMAGE-HASH] Feature enabled - sprawdzanie limitu per obrazek...
🔐 [IMAGE-HASH] Obliczony hash: abc123def456...
🔍 [KV-LIMITER] Image hash limit check: { imageHash: 'abc123def456...', count: 0, limit: 2, allowed: true }
✅ [IMAGE-HASH] Limit OK: 0/2
➕ [KV-LIMITER] Image hash limit incremented: { imageHash: 'abc123def456...', newCount: 1 }
➕ [TRANSFORM] Image hash limit incremented: 1/2

# Oczekiwany output dla 3. generacji (BLOKADA):
🔍 [IMAGE-HASH] Feature enabled - sprawdzanie limitu per obrazek...
🔐 [IMAGE-HASH] Obliczony hash: abc123def456...
🔍 [KV-LIMITER] Image hash limit check: { imageHash: 'abc123def456...', count: 2, limit: 2, allowed: false }
❌ [IMAGE-HASH] LIMIT EXCEEDED: { imageHash: 'abc123def456...', count: 2, limit: 2, reason: undefined }

# Response do frontendu:
{
  "error": "Image already used",
  "message": "To zdjęcie zostało już użyte maksymalną liczbę razy (2/2). Użyj inne zdjęcie.",
  "showLoginModal": false,
  "count": 2,
  "limit": 2,
  "imageBlocked": true
}
```

### **TEST 3: Różne obrazki (powinny działać)**

```bash
# Upload 5 RÓŻNYCH zdjęć
# Wszystkie powinny przejść ✅

# Logi powinny pokazywać różne hashe:
🔐 [IMAGE-HASH] Obliczony hash: abc123...  # Zdjęcie 1
🔐 [IMAGE-HASH] Obliczony hash: def456...  # Zdjęcie 2
🔐 [IMAGE-HASH] Obliczony hash: ghi789...  # Zdjęcie 3
# itd.
```

---

## 📊 **MONITORING W VERCEL KV**

### **Sprawdź zapisane hashe:**

```bash
# Zaloguj się do Vercel KV Dashboard
# https://vercel.com/pawemlynarczyks-projects/customify/stores

# Szukaj kluczy:
image:*:generations

# Przykład:
image:abc123def456789...:generations = 2  # Zablokowany obrazek
image:xyz987654321...:generations = 1     # Jeszcze 1 generacja dostępna
```

### **Ręczne usunięcie blokady (admin):**

Jeśli chcesz odblokować konkretny obrazek:

1. Wejdź na: https://vercel.com/pawemlynarczyks-projects/customify/stores
2. Znajdź klucz: `image:{hash}:generations`
3. **Delete** lub **Edit** → zmień wartość na 0
4. Obrazek odblokowany ✅

---

## 🚨 **ROLLBACK W RAZIE PROBLEMÓW**

### **Natychmiastowy rollback (bez edycji kodu):**

```bash
# OPCJA 1: Wyłącz przez Vercel Dashboard
1. Settings → Environment Variables
2. ENABLE_IMAGE_HASH_LIMIT → false
3. Save

# OPCJA 2: Usuń zmienną przez Vercel Dashboard
1. Settings → Environment Variables
2. ENABLE_IMAGE_HASH_LIMIT → Delete

# OPCJA 3: Wyłącz przez Vercel CLI
vercel env rm ENABLE_IMAGE_HASH_LIMIT production
```

**Po wyłączeniu:**
- Feature przestaje działać **natychmiast**
- Stare hashe pozostają w KV (nie przeszkadzają)
- Nic się nie zepsuje - kod obsługuje brak feature flaga

### **Pełny rollback (usunięcie kodu):**

Jeśli chcesz całkowicie usunąć kod:

```bash
# Wróć do commita przed feature:
git revert 94680b4  # Krok 3 (dokumentacja)
git revert 909cf84  # Krok 2 (transform.js)
git revert 2e9ab81  # Krok 1 (vercelKVLimiter.js)

# Lub bezpośredni rollback:
git checkout 48929aa  # Commit przed IMAGE-HASH-FEATURE

# Push:
git push origin main
```

---

## 🔍 **DEBUG CHECKLIST**

### **Jeśli feature nie działa:**

1. ✅ Sprawdź czy `ENABLE_IMAGE_HASH_LIMIT=true` w Vercel env
2. ✅ Sprawdź logi: `vercel logs | grep IMAGE-HASH`
3. ✅ Sprawdź czy KV jest skonfigurowany: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
4. ✅ Sprawdź czy `imageData` jest przekazywane do transform.js
5. ✅ Sprawdź Vercel KV Dashboard - czy klucze `image:*` są tworzone

### **Jeśli blokuje za wcześnie:**

1. ✅ Sprawdź wartość w KV: `image:{hash}:generations`
2. ✅ Usuń klucz ręcznie przez Vercel KV Dashboard
3. ✅ Sprawdź czy limit = 4 (nie 3 lub 2)

### **Jeśli nie blokuje:**

1. ✅ Sprawdź czy feature jest włączona: `ENABLE_IMAGE_HASH_LIMIT=true`
2. ✅ Sprawdź czy hash jest obliczany: logi `🔐 [IMAGE-HASH] Obliczony hash`
3. ✅ Sprawdź czy inkrementacja działa: logi `➕ [TRANSFORM] Image hash limit incremented`

---

## 📝 **PODSUMOWANIE**

| Akcja | Komenda/Lokalizacja |
|-------|---------------------|
| **Włącz feature** | Vercel Dashboard → Env Vars → `ENABLE_IMAGE_HASH_LIMIT=true` |
| **Wyłącz feature** | Vercel Dashboard → Env Vars → `ENABLE_IMAGE_HASH_LIMIT=false` |
| **Sprawdź logi** | `vercel logs customify-s56o.vercel.app --follow \| grep IMAGE-HASH` |
| **Sprawdź KV** | https://vercel.com/pawemlynarczyks-projects/customify/stores |
| **Odblokuj obrazek** | Vercel KV Dashboard → Delete `image:{hash}:generations` |
| **Rollback** | Vercel Dashboard → Env Vars → Delete `ENABLE_IMAGE_HASH_LIMIT` |

---

## 🎯 **ZALECENIA:**

1. **Testuj najpierw na Preview** (nie od razu Production)
2. **Monitoruj logi** przez pierwsze 24h po włączeniu
3. **Sprawdzaj Vercel KV** co kilka dni (czy nie ma zbyt wielu kluczy)
4. **Feature flag = bezpieczny rollback** - zawsze można wyłączyć bez edycji kodu

---

**Status:** Feature zaimplementowana, domyślnie **WYŁĄCZONA** ✅  
**Deployment:** Kod w produkcji, wystarczy ustawić `ENABLE_IMAGE_HASH_LIMIT=true` ✅

