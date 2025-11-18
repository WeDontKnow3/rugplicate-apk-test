import React, { useState, useRef, useEffect } from 'react';
import * as api from '../api';

const MIN_BET = 1;
const MAX_BET = 1000000;
const ANIM_DURATION = 1200;

const HEAD_IMG_URL = 'https://cdn.discordapp.com/attachments/1434987028562448589/1436397093521592350/10_20251107164843.png?ex=691d4c4a&is=691bfaca&hm=0c7dae9d2ec448be41631f015c8fbb5845219222cfe90072fdbf1097905461f0&';
const TAIL_IMG_URL = 'https://cdn.discordapp.com/attachments/1434987028562448589/1436397093869715609/10_20251107164835.png?ex=691d4c4a&is=691bfaca&hm=8edaa8682c2cff43594fe38bd12757490b8e4cd4a009fe548ee3f2660d3cbaeb&';

export default function Gambling({ onBack, onActionComplete }) {
  const [bet, setBet] = useState('');
  const [side, setSide] = useState('heads');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [result, setResult] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [landSide, setLandSide] = useState(null);
  const animTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  function clampBet(v) {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return '';
    const floored = Math.floor(n);
    if (floored < MIN_BET) return MIN_BET.toString();
    if (floored > MAX_BET) return MAX_BET.toString();
    return floored.toString();
  }

  async function handleFlip() {
    setMessage(null);
    setResult(null);
    const nBet = Number(bet);
    if (!nBet || nBet < MIN_BET || nBet > MAX_BET) {
      setMessage(`Bet must be between ${MIN_BET} and ${MAX_BET}`);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You must be logged in to play');
      return;
    }
    setProcessing(true);
    setFlipping(true);
    setLandSide(null);
    try {
      const data = await api.coinFlip(nBet, side);
      let win = false;
      let net = 0;
      let serverOk = false;
      if (data && data.ok) {
        serverOk = true;
        net = Number(data.net || 0);
        win = net > 0;
      } else {
        win = Math.random() < 0.5;
        net = win ? nBet : -nBet;
      }
      const finalSide = win ? side : (side === 'heads' ? 'tails' : 'heads');
      animTimerRef.current = setTimeout(() => {
        setFlipping(false);
        setLandSide(finalSide);
        setResult({ server: serverOk, win, net, message: data && data.message ? data.message : null });
        setMessage(win ? `You won $${Math.abs(net).toFixed(2)}` : `You lost $${Math.abs(net).toFixed(2)}`);
        if (onActionComplete && typeof onActionComplete === 'function') {
          onActionComplete({ animate: { amount: Math.abs(net), type: win ? 'up' : 'down' }, keepView: true });
        }
        setProcessing(false);
      }, ANIM_DURATION + 80);
    } catch (err) {
      const localWin = Math.random() < 0.5;
      const net = localWin ? nBet : -nBet;
      const finalSide = localWin ? side : (side === 'heads' ? 'tails' : 'heads');
      animTimerRef.current = setTimeout(() => {
        setFlipping(false);
        setLandSide(finalSide);
        setResult({ server: false, win: localWin, net, message: 'network error, simulated result' });
        setMessage(localWin ? `You won $${nBet.toFixed(2)} (simulated)` : `You lost $${nBet.toFixed(2)} (simulated)`);
        if (onActionComplete && typeof onActionComplete === 'function') {
          onActionComplete({ animate: { amount: Math.abs(net), type: net > 0 ? 'up' : 'down' }, keepView: true });
        }
        setProcessing(false);
      }, ANIM_DURATION + 80);
    }
  }

  return (
    <div className="card danger-zone">
      <style>{`
        .coin-stage{display:flex;align-items:center;gap:16px}
        .coin-wrapper{width:120px;height:120px;display:flex;align-items:center;justify-content:center}
        .coin{width:100px;height:100px;border-radius:50%;position:relative;transform-style:preserve-3d;transition:transform .28s ease, box-shadow .28s ease}
        .coin-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:50%;backface-visibility:hidden;background-size:cover;background-position:center;background-repeat:no-repeat}
        .coin-face.back{transform:rotateY(180deg)}
        .coin.spin{animation:spinSoft ${ANIM_DURATION}ms cubic-bezier(.22,.9,.3,1) forwards}
        @keyframes spinSoft{
          0%{transform:rotateY(0deg) rotateX(8deg) translateY(0) scale(1);}
          25%{transform:rotateY(540deg) rotateX(6deg) translateY(-6px) scale(1.02);}
          60%{transform:rotateY(1080deg) rotateX(3deg) translateY(-3px) scale(1.01);}
          100%{transform:rotateY(0deg) rotateX(0deg) translateY(0) scale(1);}
        }
        .coin.land-head{transform:rotateY(0deg) rotateX(0deg) translateY(0) !important}
        .coin.land-tail{transform:rotateY(180deg) rotateX(0deg) translateY(0) !important}
        .coin-shadow{width:84px;height:10px;border-radius:50%;background:rgba(0,0,0,0.18);transition:transform .28s ease, opacity .28s ease;margin-top:8px}
        .coin.spin + .coin-shadow{transform:scale(0.8);opacity:0.6}
        .controls{display:flex;gap:8px;align-items:center}
        @media (max-width:480px){ .coin-wrapper{width:88px;height:88px} .coin{width:72px;height:72px} }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Coin Flip — IMPORTANT</h2>
        <div>
          <button className="btn ghost" onClick={onBack}>Back</button>
        </div>
      </div>

      <p style={{ marginBottom: 12 }}>
        Flip a fair coin. Minimum bet {MIN_BET}, maximum bet {MAX_BET}. This is high-risk; play responsibly.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="number"
          className="small-input"
          value={bet}
          min={MIN_BET}
          max={MAX_BET}
          onChange={(e) => setBet(clampBet(e.target.value))}
          placeholder={`${MIN_BET}`}
          aria-label="Bet amount"
          style={{ width: 120 }}
        />
        <div className="controls">
          <button className={side === 'heads' ? 'btn' : 'btn ghost'} onClick={() => setSide('heads')} disabled={processing}>Heads</button>
          <button className={side === 'tails' ? 'btn' : 'btn ghost'} onClick={() => setSide('tails')} disabled={processing}>Tails</button>
        </div>
        <div>
          <button className="btn" onClick={handleFlip} disabled={processing || flipping}>
            {processing || flipping ? 'Flipping...' : 'Flip'}
          </button>
        </div>
      </div>

      <div className="coin-stage" style={{ marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>You</div>
          <div style={{ fontWeight: 800 }}>${bet || '0'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="coin-wrapper" aria-hidden>
            <div
              className={`coin ${flipping ? 'spin' : ''} ${landSide ? (landSide === 'heads' ? 'land-head' : 'land-tail') : ''}`}
            >
              <div
                className="coin-face front"
                style={{ backgroundImage: `url(${HEAD_IMG_URL})` }}
              />
              <div
                className="coin-face back"
                style={{ backgroundImage: `url(${TAIL_IMG_URL})` }}
              />
            </div>
            <div className="coin-shadow" />
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            Result
          </div>
          <div style={{ fontWeight: 800, marginTop: 4 }}>
            {result ? (result.win ? `+ $${Math.abs(result.net).toFixed(2)}` : `- $${Math.abs(result.net).toFixed(2)}`) : '—'}
          </div>
        </div>
      </div>

      {message && (
        <div className={result && result.win ? 'success-msg' : 'msg'}>
          {message}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {result.server ? 'Result from server' : 'Simulated result'}
          </div>
          <div style={{ fontWeight: 800 }}>
            {result.win ? `+ $${Math.abs(result.net).toFixed(2)}` : `- $${Math.abs(result.net).toFixed(2)}`}
          </div>
        </div>
      )}
    </div>
  );
}
