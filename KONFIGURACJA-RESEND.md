# 📧 Konfiguracja Resend dla wysyłania maili

## 🎯 CEL
Skonfigurowanie Resend do wysyłania maili z custom nadawcą (np. `Lumly <noreply@lumly.pl>`).

---

## 📝 KROK 1: Rejestracja w Resend

1. **Zarejestruj się:** https://resend.com
2. **Utwórz konto** (darmowe: 3,000 maili/miesiąc)

---

## 📝 KROK 2: Utworzenie API Key

1. **Dashboard → API Keys → Create API Key**
2. **Nazwa:** `Customify Production`
3. **Skopiuj klucz** (zaczyna się od `re_...`)
4. **⚠️ WAŻNE:** Zapisz klucz - nie będzie widoczny ponownie!

---

## 📝 KROK 3: Dodanie API Key do Vercel

1. **Vercel Dashboard:** https://vercel.com/dashboard
2. **Projekt:** `customify`
3. **Settings → Environment Variables**
4. **Dodaj zmienną:**
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_...` (twój klucz z Resend)
   - **Environment:** Production, Preview, Development
5. **Save**

---

## 📝 KROK 4: Weryfikacja domeny (opcjonalnie)

### **4.1. Dodaj domenę w Resend:**

1. **Resend Dashboard → Domains → Add Domain**
2. **Dodaj:** `lumly.pl`
3. **Resend wyśle instrukcje DNS**

### **4.2. Dodaj rekordy DNS:**

**W panelu DNS (np. Cloudflare):**

1. **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

2. **DKIM Record:**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [z Resend Dashboard]
   ```

3. **DMARC Record (opcjonalnie):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@lumly.pl
   ```

### **4.3. Zweryfikuj domenę:**

1. **Resend Dashboard → Domains → [lumly.pl]**
2. **Kliknij:** "Verify Domain"
3. **Czekaj na weryfikację** (zwykle kilka minut)

### **4.4. Użyj zweryfikowanej domeny:**

```javascript
from: 'Lumly <noreply@lumly.pl>'
```

---

## 📝 KROK 5: Testowanie

### **Test przez endpoint:**

```bash
curl -X POST https://customify-s56o.vercel.app/api/test-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "twoj-email@example.com",
    "imageUrl": "https://vzwqqb14qtsxe2wx.public.blob.vercel-storage.com/customify/temp/generation-watermarked-1764104403915.jpg",
    "style": "pixar",
    "size": "medium",
    "method": "resend"
  }'
```

### **Sprawdź skrzynkę:**

1. Otwórz skrzynkę mailową
2. Sprawdź folder SPAM (jeśli nie ma w głównej)
3. Sprawdź nadawcę: powinien być `Lumly <noreply@lumly.pl>` (po weryfikacji domeny)

---

## ⚠️ UWAGI:

### **Bez weryfikacji domeny:**
- Możesz użyć: `onboarding@resend.dev` (tylko do testów)
- Email będzie z adresu Resend, nie z `lumly.pl`

### **Z weryfikacją domeny:**
- Możesz użyć: `noreply@lumly.pl` lub `Lumly <noreply@lumly.pl>`
- Email będzie z własnej domeny

---

## ✅ CHECKLIST:

- [ ] **KROK 1:** Rejestracja w Resend
- [ ] **KROK 2:** Utworzenie API Key
- [ ] **KROK 3:** Dodanie `RESEND_API_KEY` do Vercel
- [ ] **KROK 4:** (Opcjonalnie) Weryfikacja domeny `lumly.pl`
- [ ] **KROK 5:** Testowanie endpointu

---

**Status:** 📝 Instrukcje gotowe
**Data:** 2025-01-XX
**Autor:** AI Assistant

