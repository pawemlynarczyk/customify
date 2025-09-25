# 🎯 Instrukcja instalacji nagłówka Shopify

## 📋 Co zostało przygotowane:

✅ **header-template.liquid** - kompletny kod nagłówka  
✅ **header-styles.css** - wszystkie style CSS  
✅ **HEADER-INSTALLATION.md** - ta instrukcja  

---

## 🚀 Instalacja krok po kroku:

### **1. Otwórz Shopify Admin**
- Przejdź do **Online Store** → **Themes**
- Kliknij **Actions** → **Edit code** na swoim aktywnym temacie

### **2. Dodaj kod nagłówka**
- Przejdź do **sections** → **header.liquid**
- **Zastąp całą zawartość** kodem z pliku `header-template.liquid`

### **3. Dodaj style CSS**
- Przejdź do **assets** → **theme.css** (lub stwórz nowy plik `header.css`)
- **Dodaj na końcu** kod z pliku `header-styles.css`

### **4. Skonfiguruj menu**
- Przejdź do **Online Store** → **Navigation**
- Stwórz menu o nazwie **Main menu** (lub zmień w kodzie `linklists.main-menu.links`)
- Dodaj linki do menu

### **5. Skonfiguruj logo**
- Przejdź do **Online Store** → **Themes** → **Customize**
- W sekcji **Header** ustaw swoje logo

---

## 🎨 Elementy nagłówka:

### **Logo** (lewa strona)
- Automatycznie używa logo z ustawień Shopify
- Fallback na nazwę sklepu

### **Wyszukiwarka** (środek)
- Pole tekstowe z kategoriami
- Wyszukuje w produktach, artykułach, stronach
- Pomarańczowy przycisk wyszukiwania

### **Linki użytkownika** (prawa strona)
- "Zaloguj się" / "Zarejestruj się" (dla gości)
- "Moje konto" / "Wyloguj się" (dla zalogowanych)

### **Koszyk** (prawa strona)
- Ikona koszyka z licznikiem
- Pomarańczowy hover effect

### **Menu główne** (pod głównym nagłówkiem)
- Poziome menu z dropdownami
- Responsywne na mobile

### **Breadcrumbs** (opcjonalnie)
- Pojawiają się na stronach produktów/kolekcji
- Pokazują ścieżkę nawigacji

---

## 🔧 Dostosowywanie:

### **Zmiana kolorów:**
```css
/* Główny kolor (pomarańczowy) */
#ff6b35  → zmień na swój kolor

/* Hover color */
#e55a2b  → ciemniejszy odcień głównego
```

### **Zmiana rozmiarów:**
```css
/* Wysokość nagłówka */
height: 80px;  → zmień na swój rozmiar

/* Wysokość menu */
height: 60px;  → zmień na swój rozmiar
```

### **Zmiana nazwy menu:**
W `header-template.liquid` znajdź:
```liquid
{% for link in linklists.main-menu.links %}
```
Zmień `main-menu` na nazwę swojego menu.

---

## 📱 Responsywność:

✅ **Desktop** - pełny nagłówek z wszystkimi elementami  
✅ **Tablet** - dostosowane rozmiary i odstępy  
✅ **Mobile** - uproszczony layout, ukryte elementy  

---

## 🎯 Efekt końcowy:

Twój nagłówek będzie wyglądał jak na stronie referencyjnej:
- **Czyste, minimalistyczne** design
- **Pomarańczowe akcenty** na hover
- **Profesjonalny wygląd** z cieniami
- **Pełna responsywność** na wszystkich urządzeniach

---

## ❓ Problemy? 

**Jeśli coś nie działa:**
1. Sprawdź czy skopiowałeś cały kod
2. Upewnij się że menu nazywa się "Main menu"
3. Sprawdź czy logo jest ustawione w Customize
4. Wyczyść cache przeglądarki (Ctrl+F5)

**Potrzebujesz pomocy?** - napisz, pomogę! 🚀
