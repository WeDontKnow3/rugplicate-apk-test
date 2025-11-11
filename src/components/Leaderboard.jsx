import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // 'all' | '24h' | '7d'
  const [stats, setStats] = useState({
    totalVolume24h: 0,
    activeTraders: 0,
    totalCoins: 0,
    avgProfit24h: 0
  });

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const res = await api.getLeaderboard(timeframe);

      if (res && res.leaderboard) {
        // Use API-provided leaderboard and stats (if present)
        const lb = Array.isArray(res.leaderboard) ? res.leaderboard : [];
        // ensure ranks are set and sorted by balance desc
        const sorted = [...lb].sort((a, b) => Number(b.usd_balance || 0) - Number(a.usd_balance || 0));
        sorted.forEach((item, idx) => { item.rank = item.rank || idx + 1; });
        setLeaders(sorted);

        if (res.stats) {
          setStats({
            totalVolume24h: Number(res.stats.totalVolume24h || 0),
            activeTraders: Number(res.stats.activeTraders || 0),
            totalCoins: Number(res.stats.totalCoins || 0),
            avgProfit24h: Number(res.stats.avgProfit24h || 0)
          });
        } else {
          setStats(s => ({ ...s })); // keep previous or defaults
        }
        return;
      }

      // Fallback: if API fails or returns unexpected shape, build mock data using current user
      console.warn('Leaderboard API failed or returned unexpected payload, using fallback mock data:', res);
      const meRes = await api.getMe();
      const meUser = meRes && meRes.user ? meRes.user : null;

      const mockLeaders = [
        meUser ? {
          username: meUser.username,
          usd_balance: Number(meUser.usd_balance || 1000),
          rank: 2,
          profit_24h: Number(((Math.random() - 0.5) * 500).toFixed(2)),
          total_trades: Math.floor(Math.random() * 30) + 1,
          win_rate: Math.floor(Math.random() * 40) + 40
        } : null,
        {
          username: 'crypto_whale',
          usd_balance: 8420.8,
          rank: 1,
          profit_24h: 680.2,
          total_trades: 245,
          win_rate: 78
        },
        {
          username: 'diamond_hands',
          usd_balance: 6890.3,
          rank: 3,
          profit_24h: 420.5,
          total_trades: 189,
          win_rate: 72
        }
      ].filter(Boolean);

      const sortedFallback = mockLeaders.sort((a, b) => b.usd_balance - a.usd_balance);
      sortedFallback.forEach((u, idx) => { u.rank = idx + 1; });

      setLeaders(sortedFallback);
      setStats({
        totalVolume24h: 12450.8,
        activeTraders: 156,
        totalCoins: 42,
        avgProfit24h: 85.2
      });
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      // graceful UI fallback
      setLeaders([]);
      setStats({
        totalVolume24h: 0,
        activeTraders: 0,
        totalCoins: 0,
        avgProfit24h: 0
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  function getRankBadge(rank) {
    // monochrome-friendly rank badges (no colorful emoji)
    if (rank === 1) return '①';
    if (rank === 2) return '②';
    if (rank === 3) return '③';
    return `#${rank}`;
  }

  return (
    <div className="leaderboard-page">
      {/* Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, marginBottom: 4 }}>Top Traders</h2>
            <p className="muted" style={{ margin: 0 }}>
              Ranking of top traders on the platform
            </p>
          </div>

          <div className="timeframe-selector">
            <button
              className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
            <button
              className={`timeframe-btn ${timeframe === '24h' ? 'active' : ''}`}
              onClick={() => setTimeframe('24h')}
            >
              24h
            </button>
            <button
              className={`timeframe-btn ${timeframe === '7d' ? 'active' : ''}`}
              onClick={() => setTimeframe('7d')}
            >
              7d
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div>Loading leaderboard...</div>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div>No traders found</div>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaders.map((user, idx) => (
              <div key={idx} className={`leaderboard-item rank-${user.rank || idx + 1} fade-in`} style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="rank-badge">
                  {getRankBadge(user.rank || idx + 1)}
                </div>

                <div className="leader-info">
                  <div className="leader-name">
                    {user.username}
                    {(user.rank || idx + 1) <= 3 && <span style={{ marginLeft: 8, fontSize: 14 }}>★</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                    <span>Trades: {user.total_trades || 0}</span>
                    <span>Win rate: {Number(user.win_rate || 0)}%</span>
                  </div>
                  <div className="leader-profit" style={{
                    color: (Number(user.profit_24h || 0) >= 0) ? '#16a34a' : '#ef4444',
                    marginTop: 6,
                    fontWeight: 700
                  }}>
                    {(Number(user.profit_24h || 0) >= 0) ? '↗ +' : '↘ '}${Math.abs(Number(user.profit_24h || 0)).toFixed(2)} (24h)
                  </div>
                </div>

                <div className="leader-balance">
                  <div className="balance-label">Balance</div>
                  <div className="balance-value">${Number(user.usd_balance || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>Platform Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Total Volume (24h)</div>
            <div className="stat-value">${Number(stats.totalVolume24h || 0).toFixed(2)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Active Traders</div>
            <div className="stat-value">{Number(stats.activeTraders || 0)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Coins</div>
            <div className="stat-value">{Number(stats.totalCoins || 0)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Avg. Profit (24h)</div>
            <div
              className="stat-value"
              style={{ color: Number(stats.avgProfit24h || 0) >= 0 ? '#16a34a' : '#ef4444' }}
            >
              {(Number(stats.avgProfit24h || 0) >= 0 ? '+' : '')}${Number(stats.avgProfit24h || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ background: 'rgba(15,98,254,0.05)', borderColor: 'rgba(15,98,254,0.2)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 32 }}>💡</div>
          <div>
            <h4 style={{ margin: 0, marginBottom: 8, color: '#60a5fa' }}>How to climb the ranking?</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#94a3b8', lineHeight: 1.8 }}>
              <li>Make profitable trades to increase your USD balance</li>
              <li>Keep a solid win rate (percentage of winning trades)</li>
              <li>Trade actively to increase your volume</li>
              <li>Diversify your portfolio across multiple coins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
