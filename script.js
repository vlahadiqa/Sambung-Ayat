const OFFLINE_DATA = [
    // AN-NABA (Surah 78)
    { number: 5949, text: "عَمَّ يَتَسَآءَلُونَ", surah: { number: 78 }, numberInSurah: 1, translation: "Tentang apakah mereka saling bertanya-tanya?" },
    { number: 5950, text: "عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ", surah: { number: 78 }, numberInSurah: 2, translation: "Tentang berita yang besar (hari berbangkit)." },
    { number: 5951, text: "ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ", surah: { number: 78 }, numberInSurah: 3, translation: "Yang dalam itu mereka berselisih." },
    
    // AN-NAZI'AT (Surah 79)
    { number: 5995, text: "وَٱلنَّٰزِعَٰتِ غَرْقًا", surah: { number: 79 }, numberInSurah: 1, translation: "Demi (malaikat-malaikat) yang mencabut (nyawa) dengan keras." },
    
    // ABASA (Surah 80)
    { number: 6041, text: "عَبَسَ وَتَوَلَّىٰٓ", surah: { number: 80 }, numberInSurah: 1, translation: "Dia (Muhammad) bermuka masam dan berpaling." },
    { number: 6042, text: "أَن جَآءَهُ ٱلْأَعْمَىٰ", surah: { number: 80 }, numberInSurah: 2, translation: "Karena telah datang seorang buta kepadanya." },
    
    // AT-TAKWIR (Surah 81)
    { number: 6083, text: "إِذَا ٱلشَّمْسُ كُوِّرَتْ", surah: { number: 81 }, numberInSurah: 1, translation: "Apabila matahari digulung." },
    { number: 6084, text: "وَإِذَا ٱلنُّجُومُ ٱنكَدَرَتْ", surah: { number: 81 }, numberInSurah: 2, translation: "Dan apabila bintang-bintang berjatuhan." }
];

const AUDIO_BASE_URL = "https://everyayah.com/data/Alafasy_128kbps/";
// --- AUDIO EFFECTS ---
const soundCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
const soundWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

// --- HIGH SCORE SETUP ---
// Cek apakah ada rekor tersimpan, kalau tidak ada, set 0
let highScore = localStorage.getItem('myHighScore') || 0;

// --- GAME STATE ---
let ayahsData = [];
let score = 0;
let lives = 3;
let currentMode = 'normal'; // 'normal', 'time', 'hard'
let gameTimer = null;
let timeLeft = 60;
let currentCorrectAyah = null; 
let isRoundOver = false;


// --- DOM ELEMENTS ---
const loadingScreen = document.getElementById('loading-screen');
const gameArea = document.getElementById('game-area');
const gameOverScreen = document.getElementById('game-over-screen');
const questionText = document.getElementById('question-text');
const surahInfo = document.getElementById('surah-info');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const finalScoreDisplay = document.getElementById('final-score');
const audioPlayer = document.getElementById('verse-audio');
const dropZone = document.getElementById('drop-zone');
const modeBadge = document.getElementById('mode-badge');
const timerDisplay = document.getElementById('timer-display');

// --- NAVIGATION LOGIC ---
function showPage(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('flex'); // Hapus flex jika ada
    });

    // Update tampilan High Score di Home setiap kali ganti halaman
if (pageId === 'home') {
    const highScoreEl = document.getElementById('home-high-score');
    if(highScoreEl) highScoreEl.innerText = highScore;
    }

    // Tampilkan section yang dipilih
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.classList.remove('hidden');
        // Tambahkan flex agar layout center bekerja (kecuali home block)
        if(pageId !== 'home') target.classList.add('flex');
    }
    
    // Matikan audio jika keluar dari game
    if (pageId !== 'game' && audioPlayer) {
        audioPlayer.pause();
        clearInterval(gameTimer);
    }
}

// --- GAME START LOGIC ---
function startGame(mode) {
    currentMode = mode;
    showPage('game'); // Pindah ke layar game
    
    // Set Mode UI
    modeBadge.innerText = mode.toUpperCase();
    timerDisplay.classList.add('hidden');
    
    // Reset Data
    score = 0;
    lives = 3;
    timeLeft = 60;
    
    // Mode Specific Rules
    if (mode === 'hard') {
        lives = 1; // Mode susah nyawa cuma 1
        modeBadge.innerText = "KEJAR PERINGKAT";
    } else if (mode === 'time') {
        modeBadge.innerText = "MODE WAKTU";
        timerDisplay.classList.remove('hidden');
        startTimer();
    } else {
        modeBadge.innerText = "SAMBUNG AYAT";
    }

    updateUI();
    initGameData();
}

function initGameData() {
    loadingScreen.classList.remove('hidden');
    gameArea.classList.add('hidden');
    gameArea.classList.remove('flex');
    
    ayahsData = OFFLINE_DATA; 
    
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        gameArea.classList.remove('hidden');
        gameArea.classList.add('flex');
        
        setupDropZone();
        startNewRound();
    }, 800);
}

// --- TIMER LOGIC (Khusus Mode Waktu) ---
function startTimer() {
    clearInterval(gameTimer); // Reset timer lama jika ada
    timeLeft = 60;
    updateTimerUI();
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            endGame(); // Waktu habis = Game Over
        }
    }, 1000);
}

function updateTimerUI() {
    timerDisplay.innerText = timeLeft + "s";
    if(timeLeft <= 10) {
        timerDisplay.classList.add('animate-pulse', 'font-extrabold');
    } else {
        timerDisplay.classList.remove('animate-pulse', 'font-extrabold');
    }
}

// --- GAMEPLAY ROUND ---
function startNewRound() {
    isRoundOver = false;
    resetDropZoneUI();
    
    // Pilih Ayat Acak
    const possibleQuestions = ayahsData.filter((ayah, index) => {
        return index < ayahsData.length - 1 && ayahsData[index+1].surah.englishName === ayah.surah.englishName;
    });

    const currentAyah = possibleQuestions[Math.floor(Math.random() * possibleQuestions.length)];
    const realIndex = ayahsData.indexOf(currentAyah);
    const nextAyah = ayahsData[realIndex + 1];
    
    currentCorrectAyah = nextAyah; 

    questionText.innerText = currentAyah.text;
    surahInfo.innerText = `${currentAyah.surah.englishName} : ${currentAyah.numberInSurah}`;
    
    playAudio(currentAyah);;
    generateDraggableOptions(nextAyah);
}

function generateDraggableOptions(correctAyah) {
    optionsContainer.innerHTML = '';
    let options = [correctAyah];
    
    // Ambil pengecoh
    while (options.length < 3) { 
        const distractor = ayahsData[Math.floor(Math.random() * ayahsData.length)];
        // Pastikan pengecoh tidak sama dengan jawaban benar
        if (distractor.number !== correctAyah.number && !options.includes(distractor)) {
            options.push(distractor);
        }
    }
    // Acak posisi
    options.sort(() => Math.random() - 0.5);

    // Render Kartu
    options.forEach(ayah => {
        const card = document.createElement('div');
        
        // Style sedikit diubah biar terlihat "bisa diklik"
        card.className = "bg-white border-2 border-slate-200 p-4 rounded-xl shadow-sm text-center font-arabic text-xl cursor-grab active:cursor-grabbing hover:border-yellow-500 hover:bg-yellow-50 transition touch-manipulation select-none relative";
        
        card.innerText = ayah.text;
        card.dir = "rtl";
        card.setAttribute('draggable', 'true');
        card.dataset.number = ayah.number; 
        
        // --- FITUR BARU: ICON SPEAKER KECIL ---
        // Biar user tahu ini bisa didengar
        const speakerIcon = document.createElement('span');
        speakerIcon.innerHTML = '🔊';
        speakerIcon.className = "absolute top-2 left-2 text-xs opacity-50 cursor-pointer hover:opacity-100 hover:scale-110 transition";
        speakerIcon.title = "Dengar Ayat";
        
        // Tambahkan fungsi klik pada icon speaker untuk putar suara
        speakerIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Biar tidak dianggap mau drag
            playAudio(ayah); // Panggil fungsi playAudio yang sudah kita perbaiki tadi
        });
        
        card.appendChild(speakerIcon);
        // --------------------------------------

        // Event Drag (Tetap Ada)
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', ayah.number); 
            card.classList.add('is-dragging');
        });
        
        card.addEventListener('dragend', () => card.classList.remove('is-dragging'));

        // Event Klik Kartu (Opsional: Kalau mau klik kartunya langsung bunyi juga bisa)
        // Tapi hati-hati bentrok dengan drag di HP. Lebih aman pakai icon speaker di atas.
        
        optionsContainer.appendChild(card);
    });
}

function setupDropZone() {
    // Clone node untuk menghapus event listener lama agar tidak menumpuk
    const oldDropZone = document.getElementById('drop-zone');
    const newDropZone = oldDropZone.cloneNode(true);
    oldDropZone.parentNode.replaceChild(newDropZone, oldDropZone);
    
    // Re-assign variable
    const dropZoneEl = document.getElementById('drop-zone');

    dropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        if(!isRoundOver) dropZoneEl.classList.add('drag-over');
    });

    dropZoneEl.addEventListener('dragleave', () => dropZoneEl.classList.remove('drag-over'));

    dropZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneEl.classList.remove('drag-over');
        if (isRoundOver) return;

        const droppedAyahNumber = parseInt(e.dataTransfer.getData('text/plain'));
        checkAnswer(droppedAyahNumber);
    });
}

function checkAnswer(userAnswerNumber) {
    if (userAnswerNumber === currentCorrectAyah.number) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

function handleCorrect() {
    isRoundOver = true;
    
    // 1. Mainkan Suara Benar 🔊
    soundCorrect.currentTime = 0;
    soundCorrect.play();

    score += 10;
    
    if(currentMode === 'time') {
        timeLeft += 5; 
        updateTimerUI();
    }

    updateUI();
    
    const dz = document.getElementById('drop-zone');
    dz.innerHTML = `<div class="puzzle-solved font-arabic text-center animate-bounce text-xl" dir="rtl">${currentCorrectAyah.text}</div>`;
    dz.classList.remove('border-dashed', 'bg-blue-50/50');
    
    // 2. Tampilkan Terjemahan 📖
    // Kita ambil elemen teks terjemahan (nanti kita buat di HTML)
    const transText = document.getElementById('translation-text');
    if(transText && currentCorrectAyah.translation) {
        transText.innerText = currentCorrectAyah.translation;
        transText.classList.remove('hidden');
    }

    optionsContainer.innerHTML = ''; 

    // Beri waktu lebih lama dikit (2.5 detik) biar sempat baca terjemahan
    setTimeout(() => {
        // Sembunyikan terjemahan lagi sebelum ronde baru
        if(transText) transText.classList.add('hidden');
        startNewRound();
    }, 2500); 
}

function handleWrong() {
    // 1. Mainkan Suara Salah 🔊
    soundWrong.currentTime = 0;
    soundWrong.play();

    lives--;
    updateUI();
    
    const dz = document.getElementById('drop-zone');
    dz.classList.add('animate-shake', 'border-red-500', 'bg-red-50');
    setTimeout(() => {
        dz.classList.remove('animate-shake', 'border-red-500', 'bg-red-50');
    }, 500);

    if (lives <= 0) {
        // 2. Cek High Score saat kalah 🏆
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('myHighScore', highScore); // Simpan ke HP
        }
        endGame();
    }
}

function resetDropZoneUI() {
    const dz = document.getElementById('drop-zone');
    dz.className = "w-full h-24 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden";
    dz.innerHTML = `<span class="text-gray-400 text-sm font-semibold pointer-events-none absolute z-0 animate-pulse">Geser jawaban ke sini</span>`;
}

function updateUI() {
    scoreDisplay.innerText = score;
    livesDisplay.innerText = lives;
}

function endGame() {
    clearInterval(gameTimer); // Stop timer
    gameArea.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('flex');
    finalScoreDisplay.innerText = score;
}

function restartGame() {
    // 1. Sembunyikan layar Game Over (PENTING INI)
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('flex'); 

    // 2. Munculkan kembali area permainan
    gameArea.classList.remove('hidden');

    // 3. Restart sesuai mode terakhir yang dipilih
    startGame(currentMode);
}

function playAudio(ayahData) {
    const player = document.getElementById('verse-audio');
    
    if(player && ayahData) {
        // Logika Format Nomor: 078001.mp3 (3 digit surah + 3 digit ayat)
        // Kita butuh data nomor surah dan nomor ayat
        
        // Ambil nomor surah dan ayat, lalu jadikan 3 digit (contoh: 1 jadi "001")
        let surahNum = String(ayahData.surah.number).padStart(3, '0');
        let ayahNum = String(ayahData.numberInSurah).padStart(3, '0');
        
        let fileName = `${surahNum}${ayahNum}.mp3`;
        
        console.log("Memutar Audio:", fileName); // Cek console untuk lihat nama file
        
        player.src = AUDIO_BASE_URL + fileName;
        
        player.play().catch(e => {
            console.log("Audio play error (mungkin perlu interaksi dulu):", e);
        });
    }
}

function replayAudio() {
    if(audioPlayer && audioPlayer.src) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
    }
}