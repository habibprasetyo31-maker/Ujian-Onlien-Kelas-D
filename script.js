let questions = [];
let timerInterval;
let totalSeconds = 0;

// =============== LOAD SOAL DARI JSON =================
async function loadQuestions() {
  try {
    const response = await fetch('./questions.json', { cache: 'no-store' });
    if (!response.ok) throw new Error("Gagal memuat questions.json");

    const data = await response.json();
    questions = data.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Gagal memuat soal:", error);
    alert("Soal gagal dimuat. Pastikan file questions.json ada di GitHub repository yang sama.");
  }
}

// =============== MULAI UJIAN =================
function startExam() {
  const name = document.getElementById('student-name').value.trim();
  const nim = document.getElementById('student-nim').value.trim();
  const cls = document.getElementById('student-class').value.trim();

  if (!name || !nim || !cls) {
    alert('Mohon isi nama, NIM, dan kelas terlebih dahulu.');
    return;
  }

  // Aktifkan mode fullscreen
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }

  document.getElementById('login-page').style.display = 'none';
  document.getElementById('exam-page').style.display = 'flex';

  loadQuestions().then(() => {
    renderQuestions();
    renderQuestionNumbers();
    startTimer();
  });
}

// =============== TAMPILKAN SOAL =================
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

// =============== NOMOR SOAL =================
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

// =============== TANDAI JAWABAN =================
function markAnswered(index) {
  const btn = document.getElementById(`qnum-${index}`);
  btn.classList.add('answered');
}

// =============== SCROLL KE SOAL =================
function scrollToQuestion(index) {
  const el = document.getElementById(`question-${index}`);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============== TIMER OTOMATIS =================
function startTimer() {
  const totalQuestions = questions.length;
  totalSeconds = totalQuestions * 70;
  const timerElement = document.getElementById('timer');

  function updateTimer() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerElement.textContent = `Waktu: ${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (totalSeconds <= 0) {
      clearInterval(timerInterval);
      alert('Waktu habis! Jawaban dikirim otomatis.');
      submitExam(true);
    }

    totalSeconds--;
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

// =============== KIRIM JAWABAN =================
function submitExam(autoSubmit = false) {
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

  const name = document.getElementById('student-name').value.trim();
  const nim = document.getElementById('student-nim').value.trim();
  const cls = document.getElementById('student-class').value.trim();

  // Simpan ke localStorage
  const result = { name, nim, cls, score, time: new Date().toLocaleString() };
  const allResults = JSON.parse(localStorage.getItem('examResults') || '[]');
  allResults.push(result);
  localStorage.setItem('examResults', JSON.stringify(allResults));

  // Kirim ke Google Sheet
  fetch('https://script.google.com/macros/s/AKfycbzJOD4gdNTto5bFeHF_YZpJthHJiCtM9UMXd9Zd67yd3uepKTJC8_iWqEJSJAFyf4vX/exec', {
    method: 'POST',
    body: JSON.stringify(result),
    headers: { 'Content-Type': 'application/json' },
  });

  document.getElementById('exam-page').style.display = 'none';
  document.getElementById('result-page').style.display = 'flex';
  document.getElementById('result-text').textContent = 
    `Nilai Anda: ${score} (${correctCount} dari ${questions.length} benar)`;

  // Nonaktifkan fullscreen
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

// =============== ANTI KECURANGAN =================
window.addEventListener('blur', () => {
  alert("Anda meninggalkan halaman ujian! Ujian otomatis dikirim.");
  submitExam(true);
});
