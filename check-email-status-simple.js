// check-email-status-simple.js
// Prosty skrypt do sprawdzania logów Vercel dla statusu maili

console.log('📧 SPRAWDZANIE STATUSU WYSYŁANIA MAILI\n');
console.log('📋 KROK 1: Pobierz logi z Vercel (ostatnie 24h):\n');
console.log('vercel logs customify-s56o.vercel.app --since 24h > vercel-logs.txt\n');
console.log('📋 KROK 2: Filtruj logi związane z mailami:\n');
console.log('grep -E "SAVE-GENERATION.*email|📧.*SAVE-GENERATION|✅.*Email|❌.*Email|Pomijam email" vercel-logs.txt > email-logs.txt\n');
console.log('📋 KROK 3: Sprawdź statystyki:\n');
console.log('echo "=== MAILE WYSŁANE ===" && grep "Email wysłany pomyślnie" email-logs.txt | wc -l');
console.log('echo "=== MAILE POMINIĘTE (brak emaila) ===" && grep "Pomijam email - brak emaila" email-logs.txt | wc -l');
console.log('echo "=== MAILE POMINIĘTE (brak customerId) ===" && grep "Pomijam email - brak customerId" email-logs.txt | wc -l');
console.log('echo "=== MAILE POMINIĘTE (brak watermarkedImageUrl) ===" && grep "Pomijam email - brak watermarkedImageUrl" email-logs.txt | wc -l');
console.log('echo "=== BŁĘDY WYSYŁANIA ===" && grep "Exception podczas wysyłania emaila" email-logs.txt | wc -l\n');
console.log('📋 KROK 4: Sprawdź szczegóły błędów:\n');
console.log('grep -A 5 "Exception podczas wysyłania emaila" email-logs.txt\n');
console.log('📋 ALTERNATYWA: Użyj skryptu do analizy:\n');
console.log('node check-email-status.js email-logs.txt\n');



