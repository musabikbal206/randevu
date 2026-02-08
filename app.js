// --- FIREBASE IMPORTLARI (CDN ÜZERİNDEN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- SENİN FIREBASE AYARLARIN ---
const firebaseConfig = {
  apiKey: "AIzaSyBdvhAxVobu8VvADo1JpQjo_jr68EzzEdg",
  authDomain: "randevu-487f8.firebaseapp.com",
  projectId: "randevu-487f8",
  storageBucket: "randevu-487f8.firebasestorage.app",
  messagingSenderId: "654518963323",
  appId: "1:654518963323:web:ef0fa1d68a8dd9e93b26de",
  measurementId: "G-DB14R3PQE1"
};

// --- FIREBASE BAŞLATMA ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// --- DOM ELEMENTLERİ ---
const datePicker = document.getElementById('datePicker');
const slotsContainer = document.getElementById('slotsContainer');

// --- BAŞLANGIÇ AYARLARI ---
// Bugünü seçili yap
datePicker.value = new Date().toISOString().split('T')[0];

// Olay Dinleyicileri
datePicker.addEventListener('change', loadSlots);

// Sayfa açılınca yükle
loadSlots();

// --- ZAMAN DÖNÜŞTÜRÜCÜ (TR -> IT) ---
function getItalyTime(dateStr, timeStr) {
    const trDateTimeString = `${dateStr}T${timeStr}:00+03:00`;
    const dateObj = new Date(trDateTimeString);
    
    return dateObj.toLocaleTimeString('tr-TR', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// --- ANA FONKSİYONLAR ---
async function loadSlots() {
    const selectedDate = datePicker.value;
    if (!selectedDate) return;

    slotsContainer.innerHTML = '<p class="loading-text">Saatler yükleniyor...</p>';

    // Veritabanı referansı (Yeni Syntax)
    const docRef = doc(db, "appointments", selectedDate);
    let takenSlots = [];
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            takenSlots = docSnap.data().times || [];
        }
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        slotsContainer.innerHTML = '<p style="color:red">Bağlantı hatası!</p>';
        return;
    }

    // Arayüzü temizle
    slotsContainer.innerHTML = '';

    // Saatleri oluştur (09:00 - 23:45 arası)
    let startHour = 9;
    let endHour = 24;

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 15) {
            
            // Saat formatlama
            let hourStr = h.toString().padStart(2, '0');
            let minStr = m.toString().padStart(2, '0');
            let trTime = `${hourStr}:${minStr}`;

            // İtalya saati hesaplama
            let itTime = getItalyTime(selectedDate, trTime);

            // Kart oluşturma
            const div = document.createElement('div');
            div.className = 'slot';
            
            div.innerHTML = `
                <span class="tr-time">🇹🇷 ${trTime}</span>
                <span class="it-time">🇮🇹 ${itTime}</span>
            `;

            // Doluluk kontrolü
            if (takenSlots.includes(trTime)) {
                div.classList.add('taken');
                div.title = "Bu saat dolu";
            } else {
                // Tıklama olayı (Fonksiyonu aşağıda tanımladık ama module içinde olduğu için doğrudan atıyoruz)
                div.addEventListener('click', () => toggleSlot(selectedDate, trTime, itTime));
            }

            slotsContainer.appendChild(div);
        }
    }
}

async function toggleSlot(date, trTime, itTime) {
    const msg = `Randevu Oluşturulsun mu?\n\n🇹🇷 TR: ${trTime}\n🇮🇹 IT: ${itTime}`;
    
    if (confirm(msg)) {
        try {
            const docRef = doc(db, "appointments", date);
            
            // Veriyi kaydet (Yeni Syntax: arrayUnion ve setDoc)
            await setDoc(docRef, {
                times: arrayUnion(trTime)
            }, { merge: true });
            
            alert("Randevu başarıyla alındı! ❤️");
            loadSlots(); // Listeyi yenile
            
        } catch (error) {
            console.error("Kayıt hatası:", error);
            alert("Bir hata oluştu: " + error.message);
        }
    }
}
