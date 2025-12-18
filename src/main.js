import kaboom from "https://unpkg.com/kaboom@3000.1.17/dist/kaboom.mjs";
import { QUESTIONS } from "./questions.js";

// ---------------------------
// Core config
// ---------------------------
const k = kaboom({
  background: [5, 5, 8],
  // Fullscreen-ish canvas; scales with window.
  width: 960,
  height: 540,
  letterbox: true,
});

// ---------------------------
// Helpers
// ---------------------------
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function destroyAllTagged(tag) {
  for (const o of k.get(tag)) o.destroy();
}

function button({
  text,
  x,
  y,
  w = 380,
  h = 54,
  onClick,
  hotkey,
}) {
  const base = k.add([
    k.rect(w, h, { radius: 10 }),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.color(20, 20, 30),
    k.outline(2, k.rgb(70, 70, 90)),
    "ui",
    "btn",
  ]);

  const label = k.add([
    k.text(hotkey ? `${text}  [${hotkey}]` : text, { size: 18, width: w - 24 }),
    k.pos(x, y),
    k.anchor("center"),
    k.color(230, 230, 242),
    "ui",
  ]);

  base.onHover(() => {
    base.color = k.rgb(28, 28, 42);
  });
  base.onHoverEnd(() => {
    base.color = k.rgb(20, 20, 30);
  });
  base.onClick(() => onClick?.());

  return { base, label };
}

function panel({ x, y, w, h }) {
  return k.add([
    k.rect(w, h, { radius: 14 }),
    k.pos(x, y),
    k.anchor("center"),
    k.color(10, 10, 16),
    k.outline(2, k.rgb(55, 55, 70)),
    "ui",
  ]);
}

function divider(y) {
  k.add([
    k.rect(860, 2),
    k.pos(480, y),
    k.anchor("center"),
    k.color(45, 45, 60),
    "ui",
  ]);
}

// ---------------------------
// Game model
// ---------------------------
const ACTOR = {
  PLAYER: "player",
  MONSTER: "monster",
};

function newRevolver() {
  // 6-chamber cylinder.
  // Model: bullet sits in a random chamber, cylinder starts at a random chamber ("spin").
  const chambers = 6;
  const bulletIndex = Math.floor(Math.random() * chambers);
  const cylinderIndex = Math.floor(Math.random() * chambers);

  return {
    chambers,
    bulletIndex,
    cylinderIndex,
    fired: false,

    pullTrigger() {
      if (this.fired) {
        // Already fired; should never happen mid-game, but keep safe.
        return { bang: false, reason: "spent" };
      }

      const bang = this.cylinderIndex === this.bulletIndex;
      this.cylinderIndex = (this.cylinderIndex + 1) % this.chambers;
      if (bang) this.fired = true;
      return { bang };
    },

    debugString() {
      // Intentionally vague; in a real game, we never reveal the bullet.
      const remaining = this.fired ? 0 : "?";
      return `Cylinder: ${this.chambers} chambers | Bullet: ${remaining}`;
    },
  };
}

function newDeck() {
  const deck = shuffleInPlace([...QUESTIONS]);
  return {
    drawIndex: 0,
    deck,
    draw() {
      if (this.drawIndex >= this.deck.length) {
        this.deck = shuffleInPlace([...QUESTIONS]);
        this.drawIndex = 0;
      }
      return this.deck[this.drawIndex++];
    },
  };
}

function newGameState() {
  return {
    turn: ACTOR.PLAYER,
    playerAlive: true,
    monsterAlive: true,

    // Opponent makes mistakes ~2/5 (60% correct).
    aiCorrectChance: 0.6,

    // If AI gets it right, it often chooses violence.
    aiShootChanceOnCorrect: 0.8,

    revolver: newRevolver(),
    deck: newDeck(),

    // UI / flow
    phase: "idle", // idle | question | decision | message
    currentCard: null,
    lastMessage: "",

    // bookkeeping
    round: 1,
  };
}

// ---------------------------
// Scenes
// ---------------------------

k.scene("title", () => {
  destroyAllTagged("ui");

  k.add([
    k.text("PRECALC ROULETTE", { size: 40 }),
    k.pos(480, 86),
    k.anchor("center"),
    k.color(242, 242, 255),
    "ui",
  ]);

  k.add([
    k.text(
      [
        "A dim lamp swings over the table.",
        "You are shackled. Across from you: a monster.",
        "A revolver. One bullet. A deck of math cards.",
        "Answer correctly to earn a choice.",
        "Answer wrong and you must shoot yourself.",
        "Last one standing wins.",
      ].join("\n"),
      { size: 18, width: 820, lineSpacing: 8 }
    ),
    k.pos(480, 175),
    k.anchor("top"),
    k.color(210, 210, 224),
    "ui",
  ]);

  divider(330);

  k.add([
    k.text(
      [
        "Controls:",
        "- Choose answers: [1]-[4]", 
        "- If correct: [S] shoot monster, [K] skip", 
        "- Continue prompts: [Space] / [Enter]", 
        "- Restart on end screen: [R]", 
      ].join("\n"),
      { size: 16, width: 820, lineSpacing: 6 }
    ),
    k.pos(480, 360),
    k.anchor("top"),
    k.color(170, 170, 190),
    "ui",
  ]);

  button({
    text: "Begin",
    x: 480,
    y: 485,
    w: 260,
    onClick: () => k.go("game"),
    hotkey: "Enter",
  });

  k.onKeyPress("enter", () => k.go("game"));
});

k.scene("end", (data) => {
  destroyAllTagged("ui");

  const won = Boolean(data?.won);

  const title = won ? "YOU WON!" : "GAME LOST";
  const subtitle = won
    ? "The shackles fall. The door is open. You escape into the night."
    : "The lamp flickers. The monster laughs. Everything fades.";

  k.add([
    k.text(title, { size: 56 }),
    k.pos(480, 150),
    k.anchor("center"),
    k.color(won ? 210 : 255, won ? 255 : 120, won ? 210 : 120),
    "ui",
  ]);

  k.add([
    k.text(subtitle, { size: 18, width: 760, lineSpacing: 8 }),
    k.pos(480, 220),
    k.anchor("top"),
    k.color(210, 210, 224),
    "ui",
  ]);

  divider(330);

  button({
    text: "New attempt",
    x: 480,
    y: 420,
    w: 320,
    onClick: () => k.go("game"),
    hotkey: "R",
  });

  k.add([
    k.text("Tip: Replace placeholder questions in src/questions.js", {
      size: 14,
      width: 820,
    }),
    k.pos(480, 500),
    k.anchor("center"),
    k.color(160, 160, 180),
    "ui",
  ]);

  k.onKeyPress("r", () => k.go("game"));
});

k.scene("game", () => {
  destroyAllTagged("ui");

  const state = newGameState();

  // Top HUD (persistent)
  function drawHud() {
    destroyAllTagged("hud");

    k.add([
      k.text(
        `Round ${state.round}    Turn: ${state.turn === ACTOR.PLAYER ? "You" : "Monster"}`,
        { size: 18 }
      ),
      k.pos(24, 18),
      k.anchor("topleft"),
      k.color(210, 210, 224),
      "hud",
    ]);

    k.add([
      k.text(
        `Status — You: ${state.playerAlive ? "Alive" : "Dead"} | Monster: ${
          state.monsterAlive ? "Alive" : "Dead"
        }`,
        { size: 16 }
      ),
      k.pos(24, 44),
      k.anchor("topleft"),
      k.color(170, 170, 190),
      "hud",
    ]);

    k.add([
      k.text("Revolver: 1 bullet, 6 chambers (position unknown)", { size: 14 }),
      k.pos(24, 68),
      k.anchor("topleft"),
      k.color(140, 140, 160),
      "hud",
    ]);
  }

  function clearUi() {
    destroyAllTagged("ui");
  }

  function showMessage(msg, { continueLabel = "Continue" } = {}) {
    state.phase = "message";
    state.lastMessage = msg;
    clearUi();
    drawHud();

    panel({ x: 480, y: 270, w: 860, h: 300 });

    k.add([
      k.text(msg, { size: 20, width: 800, lineSpacing: 10 }),
      k.pos(480, 220),
      k.anchor("top"),
      k.color(235, 235, 248),
      "ui",
    ]);

    button({
      text: continueLabel,
      x: 480,
      y: 430,
      w: 300,
      onClick: () => advanceFromMessage(),
      hotkey: "Space",
    });
  }

  function fireAt(target) {
    // target is ACTOR.PLAYER or ACTOR.MONSTER
    const result = state.revolver.pullTrigger();

    if (result.bang) {
      if (target === ACTOR.PLAYER) state.playerAlive = false;
      if (target === ACTOR.MONSTER) state.monsterAlive = false;
      return { bang: true };
    }

    return { bang: false };
  }

  function endIfNeeded() {
    if (!state.playerAlive) {
      k.go("end", { won: false });
      return true;
    }
    if (!state.monsterAlive) {
      k.go("end", { won: true });
      return true;
    }
    return false;
  }

  function startTurn() {
    if (endIfNeeded()) return;

    state.phase = "question";
    state.currentCard = state.deck.draw();
    clearUi();
    drawHud();

    // Table vibe (placeholder)
    k.add([
      k.rect(960, 540),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.0),
      "ui",
    ]);

    // Card panel
    panel({ x: 480, y: 280, w: 860, h: 400 });

    k.add([
      k.text(
        state.turn === ACTOR.PLAYER
          ? "You draw a card."
          : "The monster draws a card.",
        { size: 18 }
      ),
      k.pos(480, 110),
      k.anchor("center"),
      k.color(190, 190, 210),
      "ui",
    ]);

    const q = state.currentCard;

    k.add([
      k.text(q.prompt, { size: 22, width: 780, lineSpacing: 10 }),
      k.pos(480, 160),
      k.anchor("top"),
      k.color(245, 245, 255),
      "ui",
    ]);

    divider(255);

    const baseY = 290;
    const gap = 62;
    for (let i = 0; i < q.options.length; i++) {
      const label = `${i + 1}. ${q.options[i]}`;
      button({
        text: label,
        x: 480,
        y: baseY + i * gap,
        w: 780,
        h: 52,
        onClick: () => answer(i),
        hotkey: String(i + 1),
      });
    }

    k.add([
      k.text(
        state.turn === ACTOR.PLAYER
          ? "Pick an answer with [1]-[4]."
          : "The monster is thinking…",
        { size: 16 }
      ),
      k.pos(480, 490),
      k.anchor("center"),
      k.color(160, 160, 180),
      "ui",
    ]);

    if (state.turn === ACTOR.MONSTER) {
      // Let the player read the question for a beat.
      k.wait(0.9, () => aiAnswer());
    }
  }

  function answer(selectedIndex) {
    if (state.phase !== "question") return;
    if (state.turn !== ACTOR.PLAYER) return;

    const q = state.currentCard;
    const correct = selectedIndex === q.answerIndex;

    if (!correct) {
      // Forced self shot.
      const shot = fireAt(ACTOR.PLAYER);
      const msg = shot.bang
        ? [
            "Wrong.",
            "Your hands shake as you raise the revolver.",
            "BANG.",
          ].join("\n")
        : [
            "Wrong.",
            "You must shoot yourself.",
            "Click… empty.",
          ].join("\n");

      state.round++;
      showMessage(msg);
      return;
    }

    // Correct: decision phase.
    state.phase = "decision";
    clearUi();
    drawHud();

    panel({ x: 480, y: 270, w: 860, h: 300 });

    k.add([
      k.text(
        [
          "Correct.",
          "The monster leans forward.",
          "Choose:",
          "- Shoot the monster [S]",
          "- Skip the shot [K]",
        ].join("\n"),
        { size: 20, width: 800, lineSpacing: 10 }
      ),
      k.pos(480, 195),
      k.anchor("top"),
      k.color(245, 245, 255),
      "ui",
    ]);

    button({
      text: "Shoot the monster",
      x: 480,
      y: 380,
      w: 520,
      onClick: () => playerDecision("shoot"),
      hotkey: "S",
    });

    button({
      text: "Skip",
      x: 480,
      y: 445,
      w: 520,
      onClick: () => playerDecision("skip"),
      hotkey: "K",
    });
  }

  function playerDecision(decision) {
    if (state.phase !== "decision") return;

    if (decision === "skip") {
      state.round++;
      showMessage("You skip the shot. The cylinder stays a mystery.");
      return;
    }

    const shot = fireAt(ACTOR.MONSTER);
    const msg = shot.bang
      ? [
          "You aim at the monster.",
          "BANG.",
        ].join("\n")
      : [
          "You aim at the monster.",
          "Click… empty.",
        ].join("\n");

    state.round++;
    showMessage(msg);
  }

  function aiAnswer() {
    if (state.phase !== "question") return;
    if (state.turn !== ACTOR.MONSTER) return;

    const q = state.currentCard;
    const correct = Math.random() < state.aiCorrectChance;

    if (!correct) {
      // Must shoot itself.
      const shot = fireAt(ACTOR.MONSTER);
      const msg = shot.bang
        ? [
            "The monster snarls… then hesitates.",
            "Wrong.",
            "It is forced to shoot itself.",
            "BANG.",
          ].join("\n")
        : [
            "The monster snarls… then hesitates.",
            "Wrong.",
            "It is forced to shoot itself.",
            "Click… empty.",
          ].join("\n");

      state.round++;
      showMessage(msg);
      return;
    }

    // Correct: choose to shoot player or skip.
    const shoots = Math.random() < state.aiShootChanceOnCorrect;

    if (!shoots) {
      state.round++;
      showMessage(
        [
          "Correct.",
          "The monster grins… and decides to wait.",
          "It skips the shot.",
        ].join("\n")
      );
      return;
    }

    const shot = fireAt(ACTOR.PLAYER);
    const msg = shot.bang
      ? [
          "Correct.",
          "The monster takes the revolver and points it at you.",
          "BANG.",
        ].join("\n")
      : [
          "Correct.",
          "The monster takes the revolver and points it at you.",
          "Click… empty.",
        ].join("\n");

    state.round++;
    showMessage(msg);
  }

  function advanceFromMessage() {
    if (state.phase !== "message") return;

    if (endIfNeeded()) return;

    // swap turn
    state.turn = state.turn === ACTOR.PLAYER ? ACTOR.MONSTER : ACTOR.PLAYER;
    startTurn();
  }

  // Global inputs
  k.onKeyPress("1", () => answer(0));
  k.onKeyPress("2", () => answer(1));
  k.onKeyPress("3", () => answer(2));
  k.onKeyPress("4", () => answer(3));

  k.onKeyPress("s", () => playerDecision("shoot"));
  k.onKeyPress("k", () => playerDecision("skip"));

  k.onKeyPress("space", () => {
    if (state.phase === "message") advanceFromMessage();
  });
  k.onKeyPress("enter", () => {
    if (state.phase === "message") advanceFromMessage();
  });

  // Start!
  drawHud();
  showMessage(
    [
      "The monster tosses the revolver onto the table.",
      "A single bullet is loaded, the cylinder is spun.",
      "The deck is shuffled.",
      "You go first.",
    ].join("\n"),
    { continueLabel: "Draw the first card" }
  );
});

k.go("title");
