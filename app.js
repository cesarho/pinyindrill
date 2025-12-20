// Pinyin Learning App
// Uses pinyin-pro library for pinyin conversion

// State
const state = {
  currentExercise: null,
  currentCharacter: null,
  exercisePool: [],
  progress: {},
  MASTERY_THRESHOLD: 5,
  CHARS_PER_EXERCISE: 100
};

// DOM Elements
const elements = {
  menuScreen: document.getElementById('menu-screen'),
  practiceScreen: document.getElementById('practice-screen'),
  exerciseGrid: document.getElementById('exercise-grid'),
  resetBtn: document.getElementById('reset-progress'),
  backBtn: document.getElementById('back-btn'),
  progressText: document.getElementById('progress-text'),
  currentCharacter: document.getElementById('current-character'),
  pinyinInput: document.getElementById('pinyin-input'),
  hintBtn: document.getElementById('hint-btn'),
  hintDisplay: document.getElementById('hint-display'),
  feedback: document.getElementById('feedback'),
  streakText: document.getElementById('streak-text'),
  completionModal: document.getElementById('completion-modal'),
  modalClose: document.getElementById('modal-close')
};

// Initialize the app
function init() {
  loadProgress();
  renderExerciseGrid();
  setupEventListeners();
}

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem('pinyinProgress');
  if (saved) {
    state.progress = JSON.parse(saved);
  }
}

// Save progress to localStorage
function saveProgress() {
  localStorage.setItem('pinyinProgress', JSON.stringify(state.progress));
}

// Get character progress
function getCharProgress(char) {
  if (!state.progress[char]) {
    state.progress[char] = { correctStreak: 0, mastered: false };
  }
  return state.progress[char];
}

// Render exercise selection grid
function renderExerciseGrid() {
  const numExercises = Math.ceil(CHARACTERS.length / state.CHARS_PER_EXERCISE);
  elements.exerciseGrid.innerHTML = '';

  for (let i = 0; i < numExercises; i++) {
    const start = i * state.CHARS_PER_EXERCISE;
    const end = Math.min(start + state.CHARS_PER_EXERCISE, CHARACTERS.length);
    const chars = CHARACTERS.slice(start, end);

    // Count mastered characters in this exercise
    const mastered = chars.filter(char => getCharProgress(char).mastered).length;
    const isCompleted = mastered === chars.length;

    const btn = document.createElement('button');
    btn.className = `exercise-btn${isCompleted ? ' completed' : ''}`;
    btn.innerHTML = `
      <span class="range">${start + 1}-${end}</span>
      <span class="progress">${mastered}/${chars.length} mastered</span>
    `;
    btn.addEventListener('click', () => startExercise(i));
    elements.exerciseGrid.appendChild(btn);
  }
}

// Start an exercise
function startExercise(exerciseIndex) {
  state.currentExercise = exerciseIndex;
  const start = exerciseIndex * state.CHARS_PER_EXERCISE;
  const end = Math.min(start + state.CHARS_PER_EXERCISE, CHARACTERS.length);

  // Build pool of characters that aren't mastered yet
  state.exercisePool = CHARACTERS.slice(start, end).filter(char => !getCharProgress(char).mastered);

  // Update progress display
  const totalInExercise = end - start;
  const masteredCount = totalInExercise - state.exercisePool.length;
  elements.progressText.textContent = `${masteredCount} / ${totalInExercise}`;

  // Show practice screen
  elements.menuScreen.classList.add('hidden');
  elements.practiceScreen.classList.remove('hidden');

  // Reset UI
  clearFeedback();
  elements.hintDisplay.classList.add('hidden');

  // Check if exercise is complete
  if (state.exercisePool.length === 0) {
    showCompletionModal();
    return;
  }

  // Pick first character
  nextCharacter();
  elements.pinyinInput.focus();
}

// Pick next random character
function nextCharacter() {
  if (state.exercisePool.length === 0) {
    showCompletionModal();
    return;
  }

  // Random selection from pool
  const randomIndex = Math.floor(Math.random() * state.exercisePool.length);
  state.currentCharacter = state.exercisePool[randomIndex];

  // Update display
  elements.currentCharacter.textContent = state.currentCharacter;
  elements.pinyinInput.value = '';
  elements.pinyinInput.classList.remove('error');
  elements.hintDisplay.classList.add('hidden');
  clearFeedback();
  updateStreakDisplay();
}

// Get pinyin for a character
function getPinyin(char, withTone = false) {
  try {
    // Use pinyin-pro library (exposed as global 'pinyinPro')
    const options = {
      toneType: withTone ? 'symbol' : 'none'
    };
    const result = pinyinPro.pinyin(char, options);
    return result.toLowerCase();
  } catch (e) {
    console.error('Error getting pinyin:', e);
    return '';
  }
}

// Check user's answer
function checkAnswer() {
  const userAnswer = elements.pinyinInput.value.trim().toLowerCase();
  if (!userAnswer) return;

  const correctPinyin = getPinyin(state.currentCharacter, false);

  if (userAnswer === correctPinyin) {
    handleCorrectAnswer();
  } else {
    handleIncorrectAnswer();
  }
}

// Handle correct answer
function handleCorrectAnswer() {
  const charProgress = getCharProgress(state.currentCharacter);
  charProgress.correctStreak++;

  // Show success feedback
  showFeedback('Correct!', 'correct');

  // Check if mastered
  if (charProgress.correctStreak >= state.MASTERY_THRESHOLD) {
    charProgress.mastered = true;
    // Remove from pool
    const index = state.exercisePool.indexOf(state.currentCharacter);
    if (index > -1) {
      state.exercisePool.splice(index, 1);
    }
    // Update progress display
    const start = state.currentExercise * state.CHARS_PER_EXERCISE;
    const end = Math.min(start + state.CHARS_PER_EXERCISE, CHARACTERS.length);
    const totalInExercise = end - start;
    const masteredCount = totalInExercise - state.exercisePool.length;
    elements.progressText.textContent = `${masteredCount} / ${totalInExercise}`;

    showFeedback('Mastered! 🎉', 'correct');
  }

  saveProgress();

  // Move to next character after a short delay
  setTimeout(() => {
    nextCharacter();
    elements.pinyinInput.focus();
  }, 800);
}

// Handle incorrect answer
function handleIncorrectAnswer() {
  const charProgress = getCharProgress(state.currentCharacter);
  charProgress.correctStreak = 0; // Reset streak on error
  saveProgress();

  // Show error feedback
  showFeedback('Try again!', 'incorrect');
  elements.pinyinInput.classList.add('error');
  elements.pinyinInput.select();

  // Remove error class after animation
  setTimeout(() => {
    elements.pinyinInput.classList.remove('error');
  }, 400);
}

// Show feedback message
function showFeedback(message, type) {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback show ${type}`;
}

// Clear feedback
function clearFeedback() {
  elements.feedback.className = 'feedback';
  elements.feedback.textContent = '';
}

// Update streak display
function updateStreakDisplay() {
  if (state.currentCharacter) {
    const streak = getCharProgress(state.currentCharacter).correctStreak;
    elements.streakText.textContent = `Streak: ${streak}/${state.MASTERY_THRESHOLD}`;
  }
}

// Show hint (pinyin with tones)
function showHint() {
  const pinyinWithTone = getPinyin(state.currentCharacter, true);
  elements.hintDisplay.textContent = pinyinWithTone;
  elements.hintDisplay.classList.remove('hidden');

  // Reset streak when hint is used
  const charProgress = getCharProgress(state.currentCharacter);
  charProgress.correctStreak = 0;
  saveProgress();
  updateStreakDisplay();
}

// Show completion modal
function showCompletionModal() {
  elements.completionModal.classList.remove('hidden');
}

// Go back to menu
function goToMenu() {
  elements.practiceScreen.classList.add('hidden');
  elements.completionModal.classList.add('hidden');
  elements.menuScreen.classList.remove('hidden');
  renderExerciseGrid(); // Refresh progress display
}

// Reset all progress
function resetProgress() {
  if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
    state.progress = {};
    localStorage.removeItem('pinyinProgress');
    renderExerciseGrid();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Back button
  elements.backBtn.addEventListener('click', goToMenu);

  // Reset button
  elements.resetBtn.addEventListener('click', resetProgress);

  // Hint button
  elements.hintBtn.addEventListener('click', showHint);

  // Modal close
  elements.modalClose.addEventListener('click', goToMenu);

  // Input handling (Enter or Space to submit)
  elements.pinyinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent space from being typed
      checkAnswer();
    }
  });

  // Close modal on backdrop click
  elements.completionModal.addEventListener('click', (e) => {
    if (e.target === elements.completionModal) {
      goToMenu();
    }
  });
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

