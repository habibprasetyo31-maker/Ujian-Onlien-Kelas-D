let questions = [];
let timerInterval;
let totalSeconds = 0;

// ==================== LOAD SOAL DARI JSON ====================
async function loadQuestions() {
  try {
    const response = await fetch('questions.json', { cache: 'no-store' });
    if (!response.ok) throw new Error("Gagal memuat questions.json");

    const data = await response.json();
    // Acak urutan soal
    questions = data.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Gagal memuat soal:", error);
    alert("Gagal memuat soal! Pastikan file questions.json ada di folder yang sama.");
  }
}

// ==================== MULAI UJIAN ====================
function startExam() {
  const name = document.getElementById('student-name').value.trim();
  const nim = document.getElementById('student-nim').value.trim();
  const cls = document.getElementById('student-class').value.trim();

  if (!name || !nim || !cls) {
    alert('Mohon isi nama, NIM, dan kelas terlebih dahulu.');
    return;
  }

  document.getElementById('login-page').style.display = 'none';
  document.getElementById('exam-page').style.display = 'flex';

  loadQuestions().then(() => {
    renderQuestions();
    renderQuestionNumbers();
    startTimer();
  });
}

// ==================== RENDER SOAL ====================
function renderQuestions() {
  const container = document.getElementById('questions');
  container.innerHTML = '';

  questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.id = `question-${index}`;
    div.innerHTML = `
      <p><strong>${index + 1}. ${q.text}</strong></p>
      ${q.options
        .map(
          (opt) => `
        <label>
          <input type="radio" name="question-${q.id}" value="${opt}" onchange="markAnswered(${index})" />
          ${opt}
        </label><br/>
      `
        )
        .join('')}
    `;
    container.appendChild(div);
  });
}

// ==================== NAVIGASI NOMOR SOAL ====================
function renderQuestionNumbers() {
  const container = document.getElementById('question-numbers');
  container.innerHTML = '';

  questions.forEach((_, index) => {
    const btn = document.createElement('button');
    btn.textContent = index + 1;
    btn.id = `qnum-${index}`;
    btn.classList.add('number-btn');
    btn.onclick = () => scrollToQuestion(index);
    container.appendChild(btn);
  });
}

// ==================== UBAH WARNA SAAT DIJAWAB ====================
function markAnswered(index) {
  const btn = document.getElementById(`qnum-${index}`);
  btn.classList.add('answered');
}

// ==================== SCROLL KE NOMOR ====================
function scrollToQuestion(index) {
  const el = document.getElementById(`question-${index}`);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== TIMER OTOMATIS ====================
function startTimer() {
  const totalQuestions = questions.length;
  totalSeconds = totalQuestions * 70; // 70 detik per soal
  const timerElement = document.getElementById('timer');

  function updateTimer() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerElement.textContent = `Waktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (totalSeconds <= 0) {
      clearInterval(timerInterval);
      alert('Waktu habis! Jawaban akan dikirim otomatis.');
      submitExam(true); // true = otomatis kirim
    }

    totalSeconds--;
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

// ==================== KIRIM JAWABAN KE GOOGLE SHEET ====================
async function submitExam(autoSubmit = false) {
  if (!autoSubmit) {
    const confirmSubmit = confirm('Apakah Anda yakin ingin mengirim jawaban sekarang?');
    if (!confirmSubmit) return;
  }

  clearInterval(timerInterval);

  let correctCount = 0;

  questions.forEach((q) => {
    const selected = document.querySelector(`input[name="question-${q.id}"]:checked`);
    if (selected && selected.value === q.correct) {
      correctCount++;
    }
  });

  const score = ((correctCount / questions.length) * 100).toFixed(2);

  // 🔧 AMBIL DATA PESERTA
  const name = document.getElementById('student-name').value.trim();
  const nim = document.getElementById('student-nim').value.trim();
  const cls = document.getElementById('student-class').value.trim();

  // 🔧 LINK GOOGLE SCRIPT (SUDAH SESUAI DENGAN KAMU)
  const scriptURL = "https://script.google.com/macros/s/AKfycbzJOD4gdNTto5bFeHF_YZpJthHJiCtM9UMXd9Zd67yd3uepKTJC8_iWqEJSJAFyf4vX/exec";

  // 🔧 KIRIM DATA KE GOOGLE SHEET
  try {
    await fetch(scriptURL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        nim: nim,
        class: cls,
        score: score,
        correctCount: correctCount,
        totalQuestions: questions.length,
      }),
    });
  } catch (err) {
    console.error("Gagal kirim data ke Google Sheet:", err);
  }

  // 🔧 TAMPILKAN HASIL KE PESERTA
  document.getElementById('exam-page').style.display = 'none';
  document.getElementById('result-page').style.display = 'flex';
  document.getElementById('result-text').innerHTML = `
    <h2>Hasil Ujian Anda</h2>
    <table border="1" style="border-collapse:collapse; width:100%;">
      <tr><th>Nama</th><td>${name}</td></tr>
      <tr><th>NIM</th><td>${nim}</td></tr>
      <tr><th>Kelas</th><td>${cls}</td></tr>
      <tr><th>Nilai</th><td>${score}</td></tr>
      <tr><th>Benar</th><td>${correctCount}</td></tr>
      <tr><th>Total Soal</th><td>${questions.length}</td></tr>
    </table>
    <p style="color:green; font-weight:bold; margin-top:10px;">
      ✅ Hasil Anda sudah otomatis dikirim ke sistem.
    </p>
  `;
}
