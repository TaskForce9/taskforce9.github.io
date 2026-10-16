const config = window.TF9_CONFIG || {};
const lockedPanel = document.getElementById("locked-panel");
const gamePanel = document.getElementById("game-panel");
const authStatus = document.getElementById("auth-status");
const gameStatus = document.getElementById("game-status");
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const result = document.getElementById("result");
const dateLabel = document.getElementById("puzzle-date");
const operatorLabel = document.getElementById("operator-id");
const apiBase = String(config.wordleApiBaseUrl || "").replace(/\/+$/, "");

let sessionToken = "";
let currentGame = null;
let draft = "";
let submitting = false;
const keyMarks = new Map();

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

async function readResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    throw new Error(payload.error || `The game server returned ${response.status}.`);
  }
  return payload;
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  return readResponse(response);
}

function renderBoard() {
  board.replaceChildren();
  keyMarks.clear();
  const guesses = currentGame ? currentGame.guesses : [];
  const finished = !currentGame || currentGame.status !== "playing";
  const activeRow = guesses.length;

  for (let row = 0; row < 6; row += 1) {
    const guess = guesses[row];
    const isDraftRow = !finished && row === activeRow;
    const letters = guess ? guess.word : (isDraftRow ? draft : "");
    for (let column = 0; column < 5; column += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Guess ${row + 1}, letter ${column + 1}`);
      cell.textContent = letters[column] || "";
      if (letters[column]) {
        cell.classList.add("filled");
      }
      if (guess) {
        const mark = guess.marks[column];
        cell.classList.add(mark);
        const letter = guess.word[column];
        const previous = keyMarks.get(letter);
        const priority = { absent: 1, present: 2, correct: 3 };
        if (!previous || priority[mark] > priority[previous]) {
          keyMarks.set(letter, mark);
        }
      }
      board.appendChild(cell);
    }
  }

  renderKeyboard();
}

function renderKeyboard() {
  keyboard.replaceChildren();
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  rows.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";
    if (rowIndex === 2) {
      addKey(row, "ENTER", true);
    }
    for (const letter of letters) {
      addKey(row, letter, false);
    }
    if (rowIndex === 2) {
      addKey(row, "BACKSPACE", true);
    }
    keyboard.appendChild(row);
  });
}

function addKey(row, value, special) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key${special ? " special" : ""}`;
  button.dataset.key = value;
  button.textContent = value === "BACKSPACE" ? "⌫" : value;
  button.setAttribute("aria-label", value === "BACKSPACE" ? "Delete letter" : value);
  const mark = keyMarks.get(value);
  if (mark) {
    button.classList.add(mark);
  }
  button.disabled = submitting || !currentGame || currentGame.status !== "playing";
  row.appendChild(button);
}

function updateSummary() {
  if (!currentGame) {
    return;
  }
  const date = new Date(`${currentGame.date}T00:00:00Z`);
  dateLabel.textContent = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date).toUpperCase();

  if (currentGame.status === "won") {
    result.textContent = `TARGET SECURED · ${currentGame.guesses.length}/6`;
    setMessage(gameStatus, "Operation complete. Your result is locked for today.");
  } else if (currentGame.status === "lost") {
    result.textContent = `TARGET: ${currentGame.answer}`;
    setMessage(gameStatus, "No more attempts. A new target deploys at 00:00 UTC.");
  } else {
    result.textContent = "";
    const remaining = currentGame.attemptsRemaining;
    setMessage(
      gameStatus,
      `${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining. Progress saves automatically.`
    );
  }
}

async function submitDraft() {
  if (submitting || !currentGame || currentGame.status !== "playing") {
    return;
  }
  if (draft.length !== 5) {
    setMessage(gameStatus, "A five-letter guess is required.", true);
    return;
  }

  submitting = true;
  renderKeyboard();
  try {
    const response = await apiRequest("/api/game/guess", {
      method: "POST",
      body: JSON.stringify({ guess: draft }),
    });
    currentGame = response.game;
    draft = "";
    renderBoard();
    updateSummary();
  } catch (error) {
    setMessage(gameStatus, error.message || "The guess could not be submitted.", true);
  } finally {
    submitting = false;
    renderKeyboard();
  }
}

function handleKey(key) {
  if (submitting || !currentGame || currentGame.status !== "playing") {
    return;
  }
  if (key === "ENTER") {
    void submitDraft();
  } else if (key === "BACKSPACE") {
    draft = draft.slice(0, -1);
    renderBoard();
  } else if (/^[A-Z]$/.test(key) && draft.length < 5) {
    draft += key;
    renderBoard();
  }
}

function showLockedMessage(message, isError = false) {
  lockedPanel.hidden = false;
  gamePanel.hidden = true;
  setMessage(authStatus, message, isError);
}

async function connectActivity() {
  if (window.self === window.top) {
    showLockedMessage("Open this game inside the Task Force 9 Discord server.");
    return;
  }
  if (!config.discordApplicationId || !apiBase) {
    showLockedMessage("The Activity is not configured yet. Ask a server administrator to finish setup.", true);
    return;
  }

  showLockedMessage("Establishing secure Discord link…");
  try {
    const { DiscordSDK } = await import(
      "https://esm.sh/@discord/embedded-app-sdk@2.5.0?bundle"
    );
    const discordSdk = new DiscordSDK(config.discordApplicationId);
    await discordSdk.ready();

    const { code } = await discordSdk.commands.authorize({
      client_id: config.discordApplicationId,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });

    const authorization = await apiRequest("/api/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    const authenticated = await discordSdk.commands.authenticate({
      access_token: authorization.access_token,
    });
    if (!authenticated) {
      throw new Error("Discord could not authenticate this Activity. Please relaunch it.");
    }

    sessionToken = authorization.session_token;
    operatorLabel.textContent = authorization.user.displayName;
    const response = await apiRequest("/api/game/today");
    currentGame = response.game;
    lockedPanel.hidden = true;
    gamePanel.hidden = false;
    renderBoard();
    updateSummary();
  } catch (error) {
    showLockedMessage(
      error.message || "Secure connection failed. Close the Activity and try again.",
      true
    );
  }
}

document.addEventListener("keydown", (event) => {
  if (gamePanel.hidden || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    handleKey("ENTER");
  } else if (event.key === "Backspace") {
    event.preventDefault();
    handleKey("BACKSPACE");
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    handleKey(event.key.toUpperCase());
  }
});

keyboard.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");
  if (button) {
    handleKey(button.dataset.key);
  }
});

void connectActivity();
