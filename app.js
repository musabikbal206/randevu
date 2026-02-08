// --- FIREBASE IMPORTLARI ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    arrayUnion,
    arrayRemove // <-- YENİ EKLENDİ: Silme işlemi için gerekli
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

// --- BAŞLANGIÇ ---
datePicker.value = new Date().toISOString().split('T')[0];
datePicker.addEventListener('change', loadSlots);
loadSlots();

// --- ZAMAN DÖNÜŞTÜRÜCÜ ---
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

    slotsContainer.innerHTML = '<p class="loading-text">Takvim güncelleniyor...</p>';

    const docRef = doc(db, "appointments", selectedDate);
    let takenSlots = [];
    
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            takenSlots = docSnap.data().times || [];
        }
    } catch (error) {
        console.error("Hata:", error);
    }

    slotsContainer.innerHTML = '';

    let startHour = 9;
    let endHour = 24;

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 15) {
            let hourStr = h.toString().padStart(2, '0');
            let minStr = m.toString().padStart(2, '0');
            let trTime = `${hourStr}:${minStr}`;
            let itTime = getItalyTime(selectedDate, trTime);

            const div = document.createElement('div');
            div.className = 'slot';
            
            div.innerHTML = `
                <span class="tr-time">🇹🇷 ${trTime}</span>
                <span class="it-time">🇮🇹 ${itTime}</span>
            `;

            const isTaken = takenSlots.includes(trTime);

            if (isTaken) {
                div.classList.add('taken');
                div.title = "İptal etmek için tıkla";
                // Dolu olsa bile tıklanabilir yapıyoruz, ama parametre olarak 'true' (silme modu) gönderiyoruz
                div.addEventListener('click', () => handleSlotClick(selectedDate, trTime, true));
            } else {
                div.title = "Randevu al";
                // Boş ise tıklanınca 'false' (ekleme modu) gönderiyoruz
                div.addEventListener('click', () => handleSlotClick(selectedDate, trTime, false));
            }

            slotsContainer.appendChild(div);
        }
    }
}

// Yeni: Tek fonksiyon hem ekleme hem silme yapıyor
async function handleSlotClick(date, trTime, isDeleting) {
    const docRef = doc(db, "appointments", date);
    
    if (isDeleting) {
        // --- SİLME İŞLEMİ ---
        const confirmDelete = confirm(`Saat ${trTime} randevusunu İPTAL ETMEK istiyor musun? 🗑️`);
        if (confirmDelete) {
            try {
                await setDoc(docRef, {
                    times: arrayRemove(trTime) // Listeden çıkar
                }, { merge: true });
                alert("Randevu iptal edildi.");
                loadSlots();
            } catch (error) {
                console.error("Silme hatası:", error);
                alert("Bir hata oluştu.");
            }
        }
    } else {
        // --- EKLEME İŞLEMİ ---
        const confirmAdd = confirm(`Saat ${trTime} için randevu OLUŞTURUYOR musun? ❤️`);
        if (confirmAdd) {
            try {
                await setDoc(docRef, {
                    times: arrayUnion(trTime) // Listeye ekle
                }, { merge: true });
                alert("Randevu alındı! ❤️");
                loadSlots();
            } catch (error) {
                console.error("Ekleme hatası:", error);
                alert("Bir hata oluştu.");
            }
        }
    }
}
