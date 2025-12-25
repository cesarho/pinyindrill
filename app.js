// Pinyin Learning App
// Uses pinyin-pro library for pinyin conversion

// State
const state = {
  currentExercise: null,
  currentCharacter: null,
  exercisePool: [],
  progress: {},
  advancedMode: false,
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
  modalClose: document.getElementById('modal-close'),
  resetChapterBtn: document.getElementById('reset-chapter'),
  advancedModeToggle: document.getElementById('advanced-mode-toggle')
};

// Initialize the app
function init() {
  loadProgress();
  loadAdvancedMode();
  renderExerciseGrid();
  setupEventListeners();
  updatePlaceholder();
}

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem('pinyinProgress');
  if (saved) {
    state.progress = JSON.parse(saved);
  }
}

// Load advanced mode preference from localStorage
function loadAdvancedMode() {
  const saved = localStorage.getItem('pinyinAdvancedMode');
  if (saved !== null) {
    state.advancedMode = saved === 'true';
  }
  if (elements.advancedModeToggle) {
    elements.advancedModeToggle.checked = state.advancedMode;
  }
}

// Save advanced mode preference to localStorage
function saveAdvancedMode() {
  localStorage.setItem('pinyinAdvancedMode', state.advancedMode.toString());
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
  updatePlaceholder();
  elements.pinyinInput.focus();
}

// Pick next random character
function nextCharacter() {
  if (state.exercisePool.length === 0) {
    showCompletionModal();
    return;
  }

  const previousCharacter = state.currentCharacter;

  // Random selection from pool, avoiding the same character
  let randomIndex;
  if (state.exercisePool.length > 1 && previousCharacter) {
    // Filter out the previous character and pick from remaining
    const availableChars = state.exercisePool.filter(char => char !== previousCharacter);
    randomIndex = Math.floor(Math.random() * availableChars.length);
    state.currentCharacter = availableChars[randomIndex];
  } else {
    randomIndex = Math.floor(Math.random() * state.exercisePool.length);
    state.currentCharacter = state.exercisePool[randomIndex];
  }

  // Update display
  elements.currentCharacter.textContent = state.currentCharacter;
  elements.pinyinInput.value = '';
  elements.pinyinInput.classList.remove('error');
  elements.hintDisplay.classList.add('hidden');
  clearFeedback();
  updateStreakDisplay();
  updatePlaceholder();
}

// Get pinyin for a character
// Returns array of all possible readings when multiple=true
// toneFormat: 'none' (no tone), 'symbol' (ā, á, etc.), 'num' (a1, a2, etc.)
function getPinyin(char, toneFormat = 'none', multiple = false) {
  try {
    // Use pinyin-pro library (exposed as global 'pinyinPro')
    const options = {
      toneType: toneFormat,
      multiple: multiple
    };
    const result = pinyinPro.pinyin(char, options);
    if (multiple) {
      // Result is space-separated when multiple=true, split and dedupe
      const readings = result.toLowerCase().split(' ');
      return [...new Set(readings)];
    }
    return result.toLowerCase();
  } catch (e) {
    console.error('Error getting pinyin:', e);
    return multiple ? [] : '';
  }
}

// Parse pinyin with tone number format (e.g., "ma1", "zhong1") to extract base and tone
// Returns { base: 'ma', tone: 1 } or { base: 'ma', tone: null } for neutral tone
function parsePinyinWithTone(pinyinWithTone) {
  // Match pinyin ending with digit 1-4 (tone number)
  const match = pinyinWithTone.match(/^(.+?)([1-4])$/);
  if (match) {
    return {
      base: match[1],
      tone: parseInt(match[2])
    };
  }

  // No tone number - neutral tone
  return {
    base: pinyinWithTone,
    tone: null
  };
}

// Parse user input to extract pinyin base and tone number
// Returns { base: 'ma', tone: 1 } or { base: 'ma', tone: null } for neutral, or null if invalid
function parseUserInput(input) {
  // Remove any whitespace
  input = input.trim().toLowerCase();

  // Check if input ends with a digit 1-4
  const match = input.match(/^(.+?)([1-4])$/);
  if (match) {
    return {
      base: match[1],
      tone: parseInt(match[2])
    };
  }

  // No tone number - could be neutral tone or invalid
  // Return with tone: null to indicate no tone number provided
  return {
    base: input,
    tone: null
  };
}

// Update input placeholder based on mode
function updatePlaceholder() {
  if (elements.pinyinInput) {
    if (state.advancedMode) {
      elements.pinyinInput.placeholder = "type pinyin + tone (e.g., ma1)...";
    } else {
      elements.pinyinInput.placeholder = "type 'hint' for help...";
    }
  }
}


// Check user's answer
function checkAnswer() {
  const userAnswer = elements.pinyinInput.value.trim().toLowerCase();
  if (!userAnswer) return;

  // Show hint if user types "help" or "hint"
  if (userAnswer === 'help' || userAnswer === 'hint') {
    elements.pinyinInput.value = '';
    showHint();
    return;
  }

  if (state.advancedMode) {
    // Advanced mode: check pinyin + tone
    const parsed = parseUserInput(userAnswer);

    // Get all possible pinyin readings with tone numbers (e.g., "ma1", "ma2")
    const validReadingsWithTones = getPinyin(state.currentCharacter, 'num', true);

    // Check if any valid reading matches
    let isCorrect = false;
    for (let reading of validReadingsWithTones) {
      const correctReading = parsePinyinWithTone(reading);

      // Check if base and tone both match
      if (correctReading.base === parsed.base) {
        // Check tone match
        // null tone means neutral tone (no tone number), user shouldn't input number
        if (correctReading.tone === null && parsed.tone === null) {
          isCorrect = true;
          break;
        } else if (correctReading.tone !== null && parsed.tone === correctReading.tone) {
          isCorrect = true;
          break;
        }
      }
    }

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  } else {
    // Normal mode: check pinyin without tones (current behavior)
    const validReadings = getPinyin(state.currentCharacter, 'none', true);

    if (validReadings.includes(userAnswer)) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }
}

// Handle correct answer
function handleCorrectAnswer() {
  const charProgress = getCharProgress(state.currentCharacter);
  charProgress.correctStreak++;

  // Get pinyin with tones to show in feedback
  let answerText;
  if (state.advancedMode) {
    // In advanced mode, show pinyin with tone numbers (e.g., "ma1", "ma2")
    const readingsWithTones = getPinyin(state.currentCharacter, 'num', true);
    answerText = readingsWithTones.length > 1 ? readingsWithTones.join(' / ') : readingsWithTones[0];
  } else {
    // Normal mode: show pinyin with tone symbols (e.g., "mā", "má")
    const readings = getPinyin(state.currentCharacter, 'symbol', true);
    answerText = readings.length > 1 ? readings.join(' / ') : readings[0];
  }

  // Show success feedback with the answer
  showFeedback(`${answerText}`, 'correct');

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

    showFeedback(`Mastered! 🎉 ${answerText}`, 'correct');
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
  elements.hintDisplay.classList.add('hidden');
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
  // Get all possible readings with tones (using symbol format as per plan - keep unchanged)
  const readings = getPinyin(state.currentCharacter, 'symbol', true);
  // Join multiple readings with " / " separator
  const hintText = readings.length > 1 ? readings.join(' / ') : readings[0];
  elements.hintDisplay.textContent = hintText;
  elements.hintDisplay.classList.remove('hidden');
  clearFeedback();

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

// Reset progress for current chapter/exercise
function resetChapterScore() {
  const start = state.currentExercise * state.CHARS_PER_EXERCISE;
  const end = Math.min(start + state.CHARS_PER_EXERCISE, CHARACTERS.length);
  const chapterChars = CHARACTERS.slice(start, end);

  // Reset progress for all characters in this chapter
  chapterChars.forEach(char => {
    if (state.progress[char]) {
      state.progress[char] = { correctStreak: 0, mastered: false };
    }
  });

  saveProgress();

  // Hide modal and restart the exercise
  elements.completionModal.classList.add('hidden');
  startExercise(state.currentExercise);
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

  // Reset chapter score
  elements.resetChapterBtn.addEventListener('click', resetChapterScore);

  // Advanced mode toggle
  if (elements.advancedModeToggle) {
    elements.advancedModeToggle.addEventListener('change', (e) => {
      state.advancedMode = e.target.checked;
      saveAdvancedMode();
      updatePlaceholder();
    });
  }

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

  // Scroll to top when input is focused (keyboard opens on mobile)
  elements.pinyinInput.addEventListener('focus', () => {
    // Use multiple methods to ensure scroll works on iOS Safari
    const scrollToTop = () => {
      // Method 1: scrollIntoView on character
      elements.currentCharacter.scrollIntoView({ block: 'start', behavior: 'instant' });

      // Method 2: scroll window and document
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };

    // Try immediately and after delays to catch keyboard animation
    scrollToTop();
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 150);
    setTimeout(scrollToTop, 300);
  });
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

