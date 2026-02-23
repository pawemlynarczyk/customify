# DNS – brakujący DMARC (dostarczalność maili)

## Co już masz (z screenshotu)

| Subdomena | Typ | Wartość | Status |
|-----------|-----|---------|--------|
| `resend._domainkey.notification.lumly.pl` | TXT | klucz DKIM (p=MIGfMA0...) | ✅ DKIM OK |
| `send.notification.lumly.pl` | TXT | `v=spf1 include:amazonses.com ~all` | ✅ SPF OK |
| **DMARC** | — | **brak** | ❌ Do dodania |

SPF i DKIM są ustawione dla subdomeny `notification.lumly.pl`. Żeby Gmail/Yahoo traktowały maile jako wiarygodne, brakuje **DMARC** dla domeny głównej.

---

## Co dodać w panelu DNS (dla lumly.pl)

Dodaj **jeden rekord TXT**:

| Pole | Wartość |
|------|--------|
| **Subdomena / Host** | `_dmarc` |
| **Pełna nazwa** | `_dmarc.lumly.pl` (jeśli panel pyta o pełną) |
| **Typ** | TXT |
| **TTL** | 3600 (lub domyślne) |
| **Wartość** | `v=DMARC1; p=none; rua=mailto:biuro@lumly.pl` |

### Opis

- **p=none** – tylko monitorowanie (maile nie są odrzucane). Gdy upewnisz się, że wszystko działa, możesz zmienić na `p=quarantine` lub `p=reject`.
- **rua=mailto:biuro@lumly.pl** – raporty zbiorcze DMARC będą przychodzić na ten adres (opcjonalnie, ale warto).

---

## Po dodaniu

1. Zapisz zmiany w DNS i odczekaj do 24 h (zazwyczaj kilka–kilkanaście minut).
2. Sprawdź rekord: w terminalu `dig TXT _dmarc.lumly.pl` lub np. [mxtoolbox.com/dmarc](https://mxtoolbox.com/dmarc.aspx).
3. Wyślij testowy mail i sprawdź, czy trafia do skrzynki odbiorczej zamiast do spamu.

---

## Podsumowanie

- **DKIM** – masz ✅  
- **SPF** – masz ✅  
- **DMARC** – dodaj rekord `_dmarc` → `v=DMARC1; p=none; rua=mailto:biuro@lumly.pl` ✅
