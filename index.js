let boardLetters = [];
let selectedWord = '';
let selectedBoxes = [];
let usedWords = new Set();
let score = 0;

let timerInterval;
let timeLeft = 60; 
let isTimerMode = false;

// Create timer label
const timerLabel = document.createElement("div");
timerLabel.id = "timerLabel";
timerLabel.style.margin = "10px";
timerLabel.style.fontWeight = "bold";
document.querySelector(".subcontainer2").prepend(timerLabel);

function updateTimerDisplay() {
  timerLabel.textContent = isTimerMode ? `⏳ Time Left: ${timeLeft}s` : '🕓 Unlimited Mode';
}

function startTimer() {
  if (!isTimerMode) return;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Generate 16 unique letters
function generateBoardLetters() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const selected = [];
  while (selected.length < 16) {
    const index = Math.floor(Math.random() * alphabet.length);
    selected.push(alphabet.splice(index, 1)[0]);
  }
  return selected;
}

// Shuffle utility
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Update selected word
function updateSelectedDisplay() {
  document.getElementById("currentWord").textContent = selectedWord;
}

// Error message
function showError(msg) {
  const errorEl = document.getElementById("error");
  if (!errorEl) return;
  errorEl.textContent = msg;
  setTimeout(() => {
    errorEl.textContent = '';
  }, 2000);
}

// Clear selection
function clearSelection() {
  selectedWord = '';
  selectedBoxes.forEach(box => box.classList.remove('selected'));
  selectedBoxes = [];
  updateSelectedDisplay();
  document.querySelectorAll('.line').forEach(line => line.remove());

}

// Reset game state
function resetGame() {
  clearSelection();
  usedWords.clear();
  score = 0;
  updateScore();
}

// Draw connecting lines
function drawConnectingLines() {
  document.querySelectorAll('.line').forEach(line => line.remove());

  for (let i = 1; i < selectedBoxes.length; i++) {
    const prev = selectedBoxes[i - 1].getBoundingClientRect();
    const curr = selectedBoxes[i].getBoundingClientRect();

    const line = document.createElement('div');
    line.classList.add('line');

    const x1 = prev.left + prev.width / 2;
    const y1 = prev.top + prev.height / 2;
    const x2 = curr.left + curr.width / 2;
    const y2 = curr.top + curr.height / 2;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    line.style.width = `${length}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;

    document.body.appendChild(line);
  }
}

// Shuffle board
function shuffleBoard() {
  boardLetters = shuffleArray(generateBoardLetters());
  renderBoard();
 clearSelection();

}

// Render the board
function renderBoard() {
  const boxes = document.querySelectorAll('.boxcircle');
  boxes.forEach((box, index) => {
    const letter = boardLetters[index];
    box.textContent = letter.toUpperCase();
    box.classList.remove('selected');

    box.onclick = () => {
      if (box.classList.contains('selected')) return;

      const allBoxes = Array.from(document.querySelectorAll('.boxcircle'));
      const index = allBoxes.indexOf(box);
      const row = Math.floor(index / 4);
      const col = index % 4;

      if (selectedBoxes.length > 0) {
        const last = selectedBoxes[selectedBoxes.length - 1];
        const lastIndex = allBoxes.indexOf(last);
        const lastRow = Math.floor(lastIndex / 4);
        const lastCol = lastIndex % 4;

        const rowDiff = Math.abs(row - lastRow);
        const colDiff = Math.abs(col - lastCol);

        if (rowDiff > 1 || colDiff > 1) {
          showError("❌ Select adjacent letter only!");
          return;
        }
      }

      selectedWord += letter;
      box.classList.add('selected');
      selectedBoxes.push(box);
      drawConnectingLines();
      updateSelectedDisplay();
    };

    // Optional double-click to undo
    box.ondblclick = () => {
      if (selectedBoxes.length === 0) return;
      if (selectedBoxes[selectedBoxes.length - 1] === box) {
        selectedWord = selectedWord.slice(0, -1);
        box.classList.remove('selected');
        selectedBoxes.pop();
        drawConnectingLines();
        updateSelectedDisplay();
      }
    };
  });
}

// Validate word using API
async function checkWordWithAPI(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`;
  try {
    const res = await fetch(url);
    if (res.status === 404 || !res.ok) return false;
    const data = await res.json();
    return !!data[0].word;
  } catch (err) {
    console.error("API error:", err);
    return false;
  }
}

// Submit word
async function submitWord() {
  const word = selectedWord.toLowerCase();

  if (word.length < 3) {
    showError("❌ Word must be at least 3 letters long.");
    return;
  }
  if (word.length === 0) {
    showError("⚠️ Please select letters to form a word.");
    return;
  }

  

  if (usedWords.has(word)) {
    showError("❌ Word already used!");
    return;
  }

  const valid = await checkWordWithAPI(word);

  if (valid) {
    usedWords.add(word);
    score += word.length;
    updateScore();
    showError(`✔️ Word accepted: ${word}`);
  } else {
    showError("❌ Invalid word!");
  }

  clearSelection();
}

// Update score UI
function updateScore() {
  document.querySelectorAll('.score-value')[1].textContent = usedWords.size;
  document.querySelectorAll('.score-value')[0].textContent = score;
}

// End Game
// End Game
function endGame() {
  stopTimer();
  alert(`🎮 Game Over!\nScore: ${score}\nWords Found: ${usedWords.size}`);
  resetGame();       
  shuffleBoard();   
  updateTimerDisplay();

  if (isTimerMode) {
    timeLeft = 60;
    stopTimer();  
    resetGame();  
  }
}


// Setup buttons
function setupButtons() {
  document.getElementById('shuffle').addEventListener('click', shuffleBoard);
  document.querySelectorAll(".buttons button")[1].addEventListener("click", submitWord);
  document.getElementById("clear").addEventListener("click", clearSelection);

  document.querySelector(".stopgame button").addEventListener("click", endGame);

  document.querySelector(".newgame button").addEventListener("click", () => {
    shuffleBoard();
    resetGame();
    if (isTimerMode) {
      timeLeft = 60;
      startTimer();
    } else {
      stopTimer();
    }
  });

  // Radio toggle
  document.getElementById("switchMonthly").addEventListener("change", () => {
    isTimerMode = false;
    stopTimer();
    updateTimerDisplay();
  });

  document.getElementById("switchYearly").addEventListener("change", () => {
    isTimerMode = true;
    timeLeft = 60;
    startTimer();
  });
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
  shuffleBoard();
  setupButtons();
  updateTimerDisplay();
});

