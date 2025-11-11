import React, { useEffect, useState, useRef } from 'react';
import * as api from '../api';

/**
 * Sidebar.jsx (EN)
 * Lightweight, responsive sidebar
 *
 * Props:
 * - view: current view string (e.g. 'market', 'portfolio', ...)
 * - onNavigate(view): function called when a nav item is clicked
 * - onLogout(): optional callback when user logs out
 * - open: boolean (mobile open state)
 * - setOpen: function to control mobile open state
 */

export default function Sidebar({ view, onNavigate, onLogout, open, setOpen }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balanceAnim, setBalanceAnim] = useState(null); // 'up'|'down'|null
  const prevBalanceRef = useRef(null);
  const pollRef = useRef(null);

  function navigate(to) {
    if (onNavigate && typeof onNavigate === 'function') onNavigate(to);
    else window.location.hash = '#' + to;

    if (window.innerWidth < 900 && typeof setOpen === 'function') setOpen(false);
  }

  async function fetchMe() {
    setLoading(true);
    try {
      const res = await api.getMe();
      if (res && res.user) {
        const nowBal = Number(res.user.usd_balance || 0);
        const prev = prevBalanceRef.current;
        if (prev != null && nowBal !== prev) {
          setBalanceAnim(nowBal > prev ? 'up' : 'down');
          setTimeout(() => setBalanceAnim(null), 1200);
        }
        prevBalanceRef.current = nowBal;
        setMe(res.user);
      } else {
        setMe(null);
      }
    } catch (err) {
      // ignore network errors silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    fetchMe();

    // poll while page is visible
    function handleVisibility() {
      if (pollRef.current) clearInterval(pollRef.current);
      if (!document.hidden) pollRef.current = setInterval(fetchMe, 5000);
    }

    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tokensCount = (me && Array.isArray(me.tokens)) ? me.tokens.reduce((s, t) => s + Number(t.amount || 0), 0) : 0;

  function fmtUSD(n) {
    try { return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    catch (e) { return Number(n).toFixed(2); }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    if (onLogout && typeof onLogout === 'function') onLogout();
    else window.location.reload();
  }

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={() => typeof setOpen === 'function' && setOpen(false)}
        style={{ display: window.innerWidth < 900 && open ? 'block' : 'none' }}
      />

      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-expanded={open}>
        <div className="sidebar-top">
          <div className="logo">CS</div>
          <div className="sidebar-title">
            <div className="header-title">CoinSim</div>
            <div className="header-sub">AMM Simulator</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem active={view === 'market'} label="Market" onClick={() => navigate('market')} icon={'▲'} />
          <NavItem active={view === 'portfolio'} label="Portfolio" onClick={() => navigate('portfolio')} icon={'▣'} />
          <NavItem active={view === 'dashboard'} label="Dashboard" onClick={() => navigate('dashboard')} icon={'≡'} />
          <NavItem active={view === 'create'} label="Create Coin" onClick={() => navigate('create')} icon={'＋'} />
          <NavItem active={view === 'leaderboard'} label="Leaderboard" onClick={() => navigate('leaderboard')} icon={'★'} />
          <NavItem active={view === 'settings'} label="Settings" onClick={() => navigate('settings')} icon={'⚙'} />

          {me && me.is_admin && (
            <NavItem active={view === 'admin'} label="Admin" onClick={() => navigate('admin')} icon={'♛'} className="admin-item" />
          )}
        </nav>

        <div className="sidebar-bottom">
          {me ? (
            <>
              <div className="sidebar-user">
                <div className="user-avatar">{me.username ? me.username[0].toUpperCase() : '?'}</div>
                <div className="user-info">
                  <div className="user-name">{me.username}</div>
                  <div className="user-balance">
                    <span className={balanceAnim ? `balance-anim anim-${balanceAnim}` : ''}>
                      ${me ? fmtUSD(me.usd_balance || 0) : '0.00'}
                    </span>
                  </div>
                  {me.is_admin && <div className="user-badge">ADMIN</div>}
                </div>
              </div>

              <div className="tokens-info">
                <div className="tokens-label">Tokens</div>
                <div className="tokens-value">{Intl.NumberFormat().format(tokensCount)}</div>
              </div>

              <button className="logout-btn" onClick={handleLogout} aria-label="Logout">⎋ Logout</button>
            </>
          ) : (
            <div className="sidebar-login-msg">
              <p>{loading ? 'Loading...' : 'Login to trade and create coins'}</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function NavItem({ active, label, onClick, icon, className = '' }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''} ${className}`} onClick={onClick}>
      <span className="nav-icon" aria-hidden="true">{icon}</span>
      <span className="nav-label">{label}</span>
    </button>
  );
}
