# 🔒 Bezpieczny commit zmian mailingowych

## ⚠️ WAŻNE: Nie mergować do main bez pytania!

Inny model pracował nad projektem - musimy zachować jego zmiany.

---

## 📋 PLAN BEZPIECZNEGO COMMITA

### **Krok 1: Commit na branchu `mailing-walentynki`**
- ✅ Wszystkie zmiany mailingowe na branchu
- ✅ Nie dotyka main branch
- ✅ Bezpieczne dla zmian innego modelu

### **Krok 2: Push brancha do GitHub**
- ✅ Inny model widzi zmiany
- ✅ Można zrobić code review
- ✅ Nie wpływa na produkcję (main)

### **Krok 3: Merge tylko po akceptacji**
- ⚠️ **ZAWSZE PYTAJ** przed merge do main
- ⚠️ Sprawdź czy nie ma konfliktów
- ⚠️ Upewnij się że inny model nie pracuje nad tym samym

---

## 🚀 KOMENDY DO WYKONANIA

### **1. Dodaj pliki mailingowe:**
```bash
git add api/get-collection-products.js
git add api/get-old-customers.js
git add api/send-bulk-generation-emails.js
git add send-bulk-walentynki.js
git add schedule-mailing.sh
git add *.md
git add *.plist
git add *.sh
```

### **2. Commit na branchu:**
```bash
git commit -m "Dodano mailing walentynkowy - wysyłka do klientów starszych niż 2 tygodnie"
```

### **3. Push brancha (NIE main!):**
```bash
git push origin mailing-walentynki
```

### **4. NIE MERGUJ DO MAIN!**
- ⚠️ Zostaw merge do późniejszej decyzji
- ⚠️ Inny model może pracować nad main
- ⚠️ Zawsze pytaj przed merge

---

## ✅ CO ZOSTANIE W COMMICIE

### **Nowe pliki:**
- `api/get-collection-products.js` - pobieranie produktów z kolekcji
- `api/get-old-customers.js` - pobieranie klientów starszych niż 2 tygodnie
- `send-bulk-walentynki.js` - skrypt masowej wysyłki
- `schedule-mailing.sh` - skrypt automatycznego uruchomienia
- `com.customify.mailing.plist` - konfiguracja launchd
- Dokumentacja (pliki .md)

### **Zmodyfikowane pliki:**
- `api/send-bulk-generation-emails.js` - dodano template walentynkowy

---

## 🔍 SPRAWDZENIE KONFLIKTÓW

### **Przed commitem:**
```bash
# Sprawdź czy są konflikty z main
git fetch origin
git merge-base mailing-walentynki origin/main
git diff origin/main...mailing-walentynki --name-only
```

### **Jeśli są konflikty:**
- ⚠️ NIE MERGUJ automatycznie
- ⚠️ Sprawdź co zmienił inny model
- ⚠️ Rozwiąż konflikty ręcznie
- ⚠️ Zawsze pytaj przed merge

---

## 📊 STATUS PO COMMICIE

### **Na branchu `mailing-walentynki`:**
- ✅ Wszystkie zmiany mailingowe
- ✅ Gotowe do testowania
- ✅ Nie wpływa na main

### **Na branchu `main`:**
- ✅ Bez zmian (bezpieczne)
- ✅ Inny model może pracować
- ✅ Produkcja nie zmieniona

---

## ⚠️ ZASADY BEZPIECZEŃSTWA

1. **ZAWSZE commit na branchu** - nie na main
2. **ZAWSZE push brancha** - nie main
3. **NIGDY nie merge bez pytania** - zgodnie z zasadą
4. **Sprawdź konflikty** - przed merge
5. **Code review** - jeśli możliwe

---

**Status:** 📝 Gotowe do commita na branchu  
**Bezpieczeństwo:** ✅ Nie wpływa na main  
**Merge:** ⚠️ Tylko po pytaniu i akceptacji
