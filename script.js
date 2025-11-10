let questions = [];
let timerInterval;
let totalSeconds = 0;

async function loadQuestions() {
  try {
    const response = await fetch('questions.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Gagal memuat questions.json');
    const data = await response.json();
    questions = data.sort(() => Math.random() - 0.5);
  } catch (error) {
    alert('Gagal memuat soal! Pastikan file questions.json ada.');
  }
}

function startExam() {
  const name = document.getElementById('student-name').value.trim();
  const nim = document.getElementById('student-nim').value.trim();
  const cls = document.getElementById('student-class').value.trim();

  if (!name || !nim || !cls) {
    alert('Mohon isi semua kolom terlebih dahulu.');
    return;
  }

  document.getElementById('login-page').style.display = 'none';
  document.getElementById('exam-page').style.display = 'block';

  loadQuestions().then(() => {
    renderQuestions();
    renderQuestionNumbers();
    startTimer();
  });
}

function renderQuestions() {
  const container = document.getElementById('questions');
  container.innerHTML = '';
  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.id = 'question-' + i;
    div.innerHTML = `<p><strong>${i + 1}. ${q.text}</strong></p>` +
      q.options.map(opt => `
        <label>
          <input type="radio" name="question-${q.id}" value="${opt}" onchange="markAnswered(${i})">
          ${opt}
        </label><br>`).join('');
    container.appendChild(div);
  });
}

function renderQuestionNumbers() {
  const container = document.getElementById('question-numbers');
  container.innerHTML = '';
  questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.textContent = i + 1;
    btn.id = 'qnum-' + i;
    btn.classList.add('number-btn');
    btn.onclick = () => scrollToQuestion(i);
    container.appendChild(btn);
  });
}

function markAnswered(i) {
  document.getElementById('qnum-' + i).classList.add('answered');
}

function scrollToQuestion(i) {
  document.getElementById('question-' + i).scrollIntoView({ behavior: 'smooth' });
}

function startTimer() {
  totalSeconds = questions.length * 70;
  const timer = document.getElementById('timer');

  function updateTimer() {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    timer.textContent = `Waktu: ${m}:${s.toString().padStart(2, '0')}`;
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

function submitExam(autoSubmit = false) {
  if (!autoSubmit) {
    const c = confirm('Yakin ingin kirim jawaban?');
    if (!c) return;
  }

  clearInterval(timerInterval);
  let correct = 0;

  questions.forEach(q => {
    const selected = document.querySelector(`input[name="question-${q.id}"]:checked`);
    if (selected && selected.value === q.correct) correct++;
  });

  const score = ((correct / questions.length) * 100).toFixed(2);
  const result = {
    name: document.getElementById('student-name').value.trim(),
    nim: document.getElementById('student-nim').value.trim(),
    class: document.getElementById('student-class').value.trim(),
    score,
    time: new Date().toLocaleString()
  };

  let results = JSON.parse(localStorage.getItem('examResults')) || [];
  results.push(result);
  localStorage.setItem('examResults', JSON.stringify(results));

  document.getElementById('exam-page').style.display = 'none';
  document.getElementById('result-page').style.display = 'block';
  document.getElementById('result-text').textContent =
    `Nilai Anda: ${score} (${correct} dari ${questions.length} benar)`;
}
