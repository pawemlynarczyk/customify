# ⚙️ Instalacja automatycznego uruchomienia wysyłki

## 🎯 Cel
Automatyczne uruchomienie wysyłki maili o 18:00 w piątek.

---

## 📋 METODA 1: launchd (macOS) - REKOMENDOWANE

### **Krok 1: Zainstaluj plik launchd**
```bash
# Skopiuj plik do LaunchAgents
cp com.customify.mailing.plist ~/Library/LaunchAgents/

# Załaduj zadanie
launchctl load ~/Library/LaunchAgents/com.customify.mailing.plist
```

### **Krok 2: Sprawdź czy działa**
```bash
# Sprawdź status
launchctl list | grep customify

# Sprawdź logi (po uruchomieniu)
tail -f ~/Desktop/customify/mailing-output.log
```

### **Krok 3: Jeśli trzeba zmienić godzinę**
```bash
# Odładuj zadanie
launchctl unload ~/Library/LaunchAgents/com.customify.mailing.plist

# Edytuj plik com.customify.mailing.plist (zmień Hour/Minute)
# Załaduj ponownie
launchctl load ~/Library/LaunchAgents/com.customify.mailing.plist
```

### **Krok 4: Usuń automat (po wysyłce)**
```bash
launchctl unload ~/Library/LaunchAgents/com.customify.mailing.plist
rm ~/Library/LaunchAgents/com.customify.mailing.plist
```

---

## 📋 METODA 2: at command (jednorazowe)

### **Jeśli chcesz uruchomić tylko dzisiaj o 18:00:**
```bash
# Ustaw zadanie na dzisiaj 18:00
echo "cd /Users/main/Desktop/customify && node send-bulk-walentynki.js" | at 18:00

# Sprawdź zaplanowane zadania
atq

# Usuń zadanie (jeśli trzeba)
atrm <job_number>
```

---

## 📋 METODA 3: Ręczne uruchomienie z przypomnieniem

### **Najprostsze - ustaw alarm:**
1. Otwórz aplikację "Zegar" (Clock) na Mac
2. Ustaw alarm na 17:50
3. O 18:00 uruchom ręcznie: `node send-bulk-walentynki.js`

---

## ⚙️ KONFIGURACJA launchd

### **Plik: `com.customify.mailing.plist`**

**Aktualne ustawienia:**
- **Dzień:** Piątek (Weekday: 5)
- **Godzina:** 18:00 (Hour: 18, Minute: 0)

**Aby zmienić na inny dzień/godzinę:**
- **Weekday:** 1=Poniedziałek, 2=Wtorek, 3=Środa, 4=Czwartek, 5=Piątek, 6=Sobota, 7=Niedziela
- **Hour:** 0-23 (godzina)
- **Minute:** 0-59 (minuta)

**Przykład - Sobota 9:00:**
```xml
<key>Weekday</key>
<integer>6</integer>
<key>Hour</key>
<integer>9</integer>
<key>Minute</key>
<integer>0</integer>
```

---

## 🔍 SPRAWDZENIE DZIAŁANIA

### **Po instalacji:**
```bash
# Sprawdź czy zadanie jest załadowane
launchctl list | grep customify

# Zobacz logi (po uruchomieniu)
cat ~/Desktop/customify/mailing-output.log
cat ~/Desktop/customify/mailing-error.log
```

### **Test ręczny (przed automatycznym uruchomieniem):**
```bash
# Uruchom skrypt testowo
bash schedule-mailing.sh
```

---

## ⚠️ WAŻNE UWAGI

1. **Ścieżki:** Upewnij się że ścieżki w plikach są poprawne
2. **Uprawnienia:** `schedule-mailing.sh` musi mieć uprawnienia do wykonania: `chmod +x schedule-mailing.sh`
3. **Node.js:** Musi być dostępny w PATH
4. **Sieć:** Komputer musi być włączony i podłączony do internetu o 18:00

---

## ✅ CHECKLIST INSTALACJI

- [ ] Sprawdzono ścieżki w plikach
- [ ] `schedule-mailing.sh` ma uprawnienia (`chmod +x`)
- [ ] Node.js jest dostępny (`which node`)
- [ ] Plik launchd skopiowany do `~/Library/LaunchAgents/`
- [ ] Zadanie załadowane (`launchctl load`)
- [ ] Test ręczny wykonany (`bash schedule-mailing.sh`)
- [ ] Komputer będzie włączony o 18:00

---

## 🚨 ROZWIĄZYWANIE PROBLEMÓW

### **Problem: Zadanie się nie uruchamia**
```bash
# Sprawdź logi
cat ~/Desktop/customify/mailing-error.log

# Sprawdź status
launchctl list | grep customify

# Odładuj i załaduj ponownie
launchctl unload ~/Library/LaunchAgents/com.customify.mailing.plist
launchctl load ~/Library/LaunchAgents/com.customify.mailing.plist
```

### **Problem: Błędy w skrypcie**
```bash
# Uruchom ręcznie i sprawdź błędy
bash schedule-mailing.sh
```

---

**Status:** 📝 Gotowe do instalacji  
**Rekomendowana metoda:** launchd (macOS)  
**Czas uruchomienia:** Piątek 18:00
