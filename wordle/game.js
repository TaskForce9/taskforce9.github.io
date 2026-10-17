import { DiscordSDK } from "@discord/embedded-app-sdk";

const config = window.TF9_CONFIG || {};
const lockedPanel = document.getElementById("locked-panel");
const gamePanel = document.getElementById("game-panel");
const authStatus = document.getElementById("auth-status");
const playButton = document.getElementById("play-button");
const gameStatus = document.getElementById("game-status");
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const result = document.getElementById("result");
const dateLabel = document.getElementById("puzzle-date");
const operatorLabel = document.getElementById("operator-id");
const apiBase = window.TF9_ACTIVITY_ENTRY
  ? ""
  : String(config.wordleApiBaseUrl || "").replace(/\/+$/, "");
const apiProxyPrefix = window.TF9_ACTIVITY_ENTRY ? "/api" : "";

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

function reportActivityDiagnostic(event, stage, status) {
  if (!window.TF9_ACTIVITY_ENTRY) {
    return;
  }
  const directApiBase = String(config.wordleApiBaseUrl || "").replace(/\/+$/, "");
  const endpoints = [
    `${directApiBase}/api/diagnostics`,
    `${apiProxyPrefix}/api/diagnostics`,
  ].filter((endpoint, index, all) => endpoint && all.indexOf(endpoint) === index);
  const payload = { event, stage };
  if (status !== undefined) {
    payload.status = status;
  }
  void (async () => {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        if (response.ok) {
          return;
        }
      } catch {
        continue;
      }
    }
    console.warn("TF9 Activity diagnostics could not reach the game API.");
  })();
}

async function apiRequest(path, options = {}, diagnosticStage) {
  const headers = new Headers(options.headers || {});
  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  let response;
  try {
    response = await fetch(`${apiBase}${apiProxyPrefix}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    reportActivityDiagnostic("network_error", diagnosticStage);
    if (error instanceof TypeError && window.TF9_ACTIVITY_ENTRY) {
      throw new Error(
        "Could not reach the game server through Discord. Check the Activity URL mapping: /api → tf9-game.wispbyte.app."
      );
    }
    throw error;
  }
  if (!response.ok) {
    reportActivityDiagnostic("http_error", diagnosticStage, response.status);
  }
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
    const response = await apiRequest(
      "/api/game/guess",
      {
        method: "POST",
        body: JSON.stringify({ guess: draft }),
      },
      "guess_submit"
    );
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
  if (window.self === window.top && !window.TF9_ACTIVITY_ENTRY) {
    showLockedMessage("Open this game inside the Task Force 9 Discord server.");
    return;
  }
  if (!config.discordApplicationId || (!window.TF9_ACTIVITY_ENTRY && !apiBase)) {
    showLockedMessage("The Activity is not configured yet. Ask a server administrator to finish setup.", true);
    return;
  }

  showLockedMessage("Establishing secure Discord link…");
  let diagnosticStage = "sdk_ready";
  try {
    const discordSdk = new DiscordSDK(config.discordApplicationId);
    await Promise.race([
      discordSdk.ready(),
      new Promise((_, reject) => {
        window.setTimeout(
          () => reject(new Error("Discord did not respond. Close and relaunch the Activity, then try again.")),
          15000
        );
      }),
    ]);

    diagnosticStage = "authorize";
    const { code } = await discordSdk.commands.authorize({
      client_id: config.discordApplicationId,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });

    diagnosticStage = "auth_exchange";
    const authorization = await apiRequest("/api/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    }, "auth_exchange");
    diagnosticStage = "authenticate";
    const authenticated = await discordSdk.commands.authenticate({
      access_token: authorization.access_token,
    });
    if (!authenticated) {
      throw new Error("Discord could not authenticate this Activity. Please relaunch it.");
    }

    sessionToken = authorization.session_token;
    operatorLabel.textContent = authorization.user.displayName;
    setMessage(authStatus, `Connected as ${authorization.user.displayName}. Ready when you are.`);
    authStatus.hidden = true;
    playButton.hidden = false;
  } catch (error) {
    if (diagnosticStage !== "auth_exchange") {
      reportActivityDiagnostic("activity_error", diagnosticStage);
    }
    showLockedMessage(
      error.message || "Secure connection failed. Close the Activity and try again.",
      true
    );
  }
}

async function startGame() {
  playButton.disabled = true;
  authStatus.hidden = false;
  setMessage(authStatus, "Loading today's Wordle…");
  try {
    const response = await apiRequest("/api/game/today", {}, "game_load");
    currentGame = response.game;
    lockedPanel.hidden = true;
    gamePanel.hidden = false;
    renderBoard();
    updateSummary();
  } catch (error) {
    setMessage(
      authStatus,
      error.message || "The game could not be loaded. Please try again.",
      true
    );
  } finally {
    playButton.disabled = false;
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

playButton.addEventListener("click", () => {
  void startGame();
});

void connectActivity();
