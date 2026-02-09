// --- FIREBASE IMPORTLARI ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, arrayUnion, arrayRemove } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  authDomain: "randevu-487f8.firebaseapp.com",
  projectId: "randevu-487f8",
  storageBucket: "randevu-487f8.firebasestorage.app",
  messagingSenderId: "654518963323",
  appId: "1:654518963323:web:ef0fa1d68a8dd9e93b26de",
  measurementId: "G-DB14R3PQE1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM ELEMENTLERİ ---
const datePicker = document.getElementById('datePicker');
const slotsContainer = document.getElementById('slotsContainer');
const modal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const btnConfirm = document.getElementById('btnConfirm');
const btnCancel = document.getElementById('btnCancel');

// --- DEĞİŞKENLER ---
// Onay butonuna basılınca hangi işlemin yapılacağını burada tutacağız
let currentAction = null; 

// --- BAŞLANGIÇ ---
datePicker.value = new Date().toISOString().split('T')[0];
datePicker.addEventListener('change', loadSlots);
loadSlots();

// Modal Kapatma Olayları
btnCancel.addEventListener('click', closeModal);
// Boşluğa tıklayınca kapatma
modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
});

// --- ZAMAN FONKSİYONU ---
function getItalyTime(dateStr, timeStr) {
    const trDateTimeString = `${dateStr}T${timeStr}:00+03:00`;
    const dateObj = new Date(trDateTimeString);
    return dateObj.toLocaleTimeString('tr-TR', {
        timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit'
    });
}

// --- ANA AKIŞ ---
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
            div.innerHTML = `<span class="tr-time">🇹🇷 ${trTime}</span><span class="it-time">🇮🇹 ${itTime}</span>`;

            const isTaken = takenSlots.includes(trTime);

            if (isTaken) {
                div.classList.add('taken');
                // Tıklayınca SILME penceresini aç
                div.addEventListener('click', () => 
                    openModal(selectedDate, trTime, true)
                );
            } else {
                // Tıklayınca EKLEME penceresini aç
                div.addEventListener('click', () => 
                    openModal(selectedDate, trTime, false)
                );
            }
            slotsContainer.appendChild(div);
        }
    }
}

// --- MODAL YÖNETİMİ ---
function openModal(date, time, isDeleting) {
    // Modalı ekrana getir
    modal.classList.add('active');

    if (isDeleting) {
        // Silme Modu Ayarları
        modalTitle.innerText = "İptal Et?";
        modalMessage.innerText = `${time} saatindeki randevuyu iptal etmek istediğine emin misin?`;
        btnConfirm.innerText = "Evet, İptal Et";
        btnConfirm.classList.add('delete-mode');
        
        // İşlemi Tanımla
        currentAction = async () => {
            const docRef = doc(db, "appointments", date);
            await setDoc(docRef, { times: arrayRemove(time) }, { merge: true });
            closeModal();
            loadSlots();
        };

    } else {
        // Ekleme Modu Ayarları
        modalTitle.innerText = "Randevu Al";
        modalMessage.innerText = `Saat ${time} için randevu oluşturulsun mu?`;
        btnConfirm.innerText = "Evet, Onayla ❤️";
        btnConfirm.classList.remove('delete-mode');

        // İşlemi Tanımla
        currentAction = async () => {
            const docRef = doc(db, "appointments", date);
            await setDoc(docRef, { times: arrayUnion(time) }, { merge: true });
            closeModal();
            loadSlots();
        };
    }
}

// Onay butonuna basılınca tanımlanan işlemi yap
btnConfirm.onclick = () => {
    if (currentAction) {
        btnConfirm.innerText = "İşleniyor..."; // Buton yazısını değiştir
        currentAction();
    }
};

function closeModal() {
    modal.classList.remove('active');
    currentAction = null;
}
