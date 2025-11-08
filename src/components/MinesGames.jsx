import React, { useState, useMemo, useEffect } from "react";
// MinesGame.jsx
// Página de Mines (5x5), integra visualmente com o CSS existente do projeto.
// Regras: grid 5x5 (25 casas), min mines = 3, max mines = 23, min bet = 1

export default function MinesGame() {
  const TOTAL_CELLS = 25;
  const MIN_MINES = 3;
  const MAX_MINES = 23;
  const MIN_BET = 1;
  const HOUSE_EDGE = 0.01; // 1% house edge applied to payout

  const [bet, setBet] = useState(1);
  const [minesCount, setMinesCount] = useState(5);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9).toString(16));

  const [started, setStarted] = useState(false);
  const [cellsRevealed, setCellsRevealed] = useState(() => Array(TOTAL_CELLS).fill(false));
  const [mines, setMines] = useState(new Set());
  const [hits, setHits] = useState(0); // successful safe reveals
  const [lost, setLost] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // reset UI when minesCount or bet change while not started
    if (!started) {
      setCellsRevealed(Array(TOTAL_CELLS).fill(false));
      setMines(new Set());
      setHits(0);
      setLost(false);
      setCashoutAmount(0);
      setMessage("");
    }
  }, [minesCount, bet, started]);

  function clampMines(n) {
    return Math.max(MIN_MINES, Math.min(MAX_MINES, Number(n) || MIN_MINES));
  }

  function clampBet(v) {
    const n = Number(v) || 0;
    return Math.max(MIN_BET, n);
  }

  function generateMines(count, seedStr) {
    // simple seeded RNG using xorshift32-like
    let s = parseInt(seedStr, 16) || Math.floor(Math.random() * 1e9);
    function rnd() {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967295;
    }
    const picks = new Set();
    while (picks.size < count) {
      const idx = Math.floor(rnd() * TOTAL_CELLS);
      picks.add(idx);
    }
    return picks;
  }

  function startGame() {
    const b = clampBet(bet);
    const m = clampMines(minesCount);
    if (b < MIN_BET) {
      setMessage(`Aposta mínima é ${MIN_BET}`);
      return;
    }
    const newSeed = Math.floor(Math.random() * 1e9).toString(16);
    setSeed(newSeed);
    const minesSet = generateMines(m, newSeed);
    setMines(minesSet);
    setCellsRevealed(Array(TOTAL_CELLS).fill(false));
    setHits(0);
    setLost(false);
    setStarted(true);
    setCashoutAmount(0);
    setMessage("Jogo iniciado. Boa sorte!");
  }

  function survivalProbability(safePicks, minesNum) {
    // probability of surviving safePicks picks in a 25-cell board with minesNum mines
    let prob = 1;
    for (let i = 0; i < safePicks; i++) {
      prob *= (TOTAL_CELLS - minesNum - i) / (TOTAL_CELLS - i);
    }
    return prob;
  }

  function multiplierForPicks(safePicks, minesNum) {
    // fair multiplier with a HOUSE_EDGE applied
    if (safePicks === 0) return 1;
    const surv = survivalProbability(safePicks, minesNum);
    if (surv <= 0) return 0;
    const fair = 1 / surv; // expected fair payout multiplier
    return fair * (1 - HOUSE_EDGE);
  }

  const currentMultiplier = useMemo(() => {
    return multiplierForPicks(hits, mines.size || minesCount);
  }, [hits, mines, minesCount]);

  function revealCell(idx) {
    if (!started || lost) return;
    if (cellsRevealed[idx]) return;

    const newRevealed = cellsRevealed.slice();
    newRevealed[idx] = true;
    setCellsRevealed(newRevealed);

    if (mines.has(idx)) {
      // hit a mine -> lose
      setLost(true);
      setStarted(false);
      setMessage("Você explodiu! Perdeu a aposta.");
      setCashoutAmount(0);
      // reveal all mines visually by revealing them too
      const revealAll = newRevealed.slice();
      mines.forEach((m) => (revealAll[m] = true));
      setCellsRevealed(revealAll);
      return;
    }

    // safe reveal
    const newHits = hits + 1;
    setHits(newHits);
    const payout = bet * multiplierForPicks(newHits, mines.size || minesCount);
    setCashoutAmount(Number(payout.toFixed(2)));
    setMessage("Safe! Você pode continuar ou sacar.");

    // automatic win if all safe cells revealed
    const totalSafe = TOTAL_CELLS - (mines.size || minesCount);
    if (newHits >= totalSafe) {
      setMessage("Você revelou todas as casas seguras — Vitória!");
      setStarted(false);
    }
  }

  function cashout() {
    if (lost || !started && hits === 0) return;
    if (hits === 0) {
      setMessage("Revele ao menos uma casa antes de sacar.");
      return;
    }
    const payout = bet * multiplierForPicks(hits, mines.size || minesCount);
    const amount = Number(payout.toFixed(2));
    setMessage(`Você sacou ${amount}. Parabéns!`);
    setStarted(false);
    // reveal mines after cashout
    const revealAll = cellsRevealed.slice();
    mines.forEach((m) => (revealAll[m] = true));
    setCellsRevealed(revealAll);
    setCashoutAmount(amount);
  }

  function reset() {
    setStarted(false);
    setCellsRevealed(Array(TOTAL_CELLS).fill(false));
    setMines(new Set());
    setHits(0);
    setLost(false);
    setCashoutAmount(0);
    setMessage("");
    setSeed(Math.floor(Math.random() * 1e9).toString(16));
  }

  // grid render helpers
  const grid = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c;
      const revealed = cellsRevealed[idx];
      const isMine = mines.has(idx);
      row.push(
        <button
          key={idx}
          className={`mines-cell ${revealed ? (isMine ? 'mine' : 'safe') : 'hidden'}`}
          onClick={() => revealCell(idx)}
          disabled={!started || revealed || lost}
          aria-label={`cell-${idx}`}
        >
          {revealed ? (isMine ? '💣' : hits && !isMine ? '✓' : '') : ''}
        </button>
      );
    }
    grid.push(
      <div key={r} className="mines-row">
        {row}
      </div>
    );
  }

  return (
    <div className="mines-page">
      <h2>Mines (5x5)</h2>
      <div className="mines-controls">
        <label>
          Aposta mínima: {MIN_BET}
          <input
            type="number"
            min={MIN_BET}
            value={bet}
            onChange={(e) => setBet(clampBet(e.target.value))}
            disabled={started}
          />
        </label>
        <label>
          Minas (min {MIN_MINES} / max {MAX_MINES}):
          <input
            type="number"
            min={MIN_MINES}
            max={MAX_MINES}
            value={minesCount}
            onChange={(e) => setMinesCount(clampMines(e.target.value))}
            disabled={started}
          />
        </label>
        <div className="mines-buttons">
          {!started ? (
            <button onClick={startGame} className="btn-start">Iniciar</button>
          ) : (
            <button onClick={reset} className="btn-reset">Reset</button>
          )}
          <button onClick={cashout} className="btn-cashout" disabled={!started && hits === 0}>
            Sacar ({cashoutAmount.toFixed(2)})
          </button>
        </div>
      </div>

      <div className="mines-board" aria-hidden={!started && hits === 0}>
        {grid}
      </div>

      <div className="mines-info">
        <div>Seed do jogo: <code>{seed}</code></div>
        <div>Minas: {minesCount}</div>
        <div>Reveladas com sucesso: {hits}</div>
        <div>Multiplicador atual: x{currentMultiplier ? currentMultiplier.toFixed(4) : '0'}</div>
        <div>Status: {message}</div>
      </div>

      <style jsx>{`
        /* Minimal local fallback so the component is usable even if your global CSS hasn't
           defined specific mines rules. The project CSS will take precedence. */
        .mines-page { padding: 12px; }
        .mines-controls { display:flex; gap:12px; align-items:center; margin-bottom:12px; flex-wrap:wrap }
        .mines-board { display:flex; flex-direction:column; gap:6px; margin-top:12px }
        .mines-row { display:flex; gap:6px }
        .mines-cell { width:44px; height:44px; border-radius:6px; border:1px solid #222; display:flex; align-items:center; justify-content:center; font-weight:700; cursor:pointer }
        .mines-cell.hidden { background:#111 }
        .mines-cell.safe { background:#0b4; color:#001 }
        .mines-cell.mine { background:#a22; color:#fff }
        .mines-info { margin-top:12px; font-size:14px }
        .btn-start, .btn-reset, .btn-cashout { padding:8px 12px; border-radius:8px; cursor:pointer }
      `}</style>
    </div>
  );
}
