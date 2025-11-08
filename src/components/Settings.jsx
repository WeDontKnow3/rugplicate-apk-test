import React, { useEffect, useState } from 'react';
import * as api from '../api';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalVolume: 0,
    winRate: 0,
    accountAge: 0
  });

  // Carregar tema salvo e dados do usuário
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    try {
      const [userRes, txRes] = await Promise.all([
        api.getMe(),
        api.getTransactions()
      ]);

      if (userRes && userRes.user) {
        setUser(userRes.user);
        
        // Calcular estatísticas
        const txs = txRes.transactions || [];
        const tradeTxs = txs.filter(t => t.type === 'buy' || t.type === 'sell');
        
        const totalVolume = tradeTxs.reduce((sum, t) => sum + Number(t.usd_amount || 0), 0);
        
        // Calcular win rate (simplificado)
        const buyTxs = tradeTxs.filter(t => t.type === 'buy');
        const sellTxs = tradeTxs.filter(t => t.type === 'sell');
        let wins = 0;
        buyTxs.forEach(buy => {
          const sell = sellTxs.find(s => 
            s.coin_id === buy.coin_id && 
            new Date(s.created_at) > new Date(buy.created_at) &&
            s.price > buy.price
          );
          if (sell) wins++;
        });
        const winRate = buyTxs.length > 0 ? (wins / buyTxs.length) * 100 : 0;
        
        // Calcular idade da conta (mock - seria created_at do user)
        const accountAge = Math.floor(Math.random() * 90) + 1; // dias
        
        setStats({
          totalTrades: tradeTxs.length,
          totalVolume: totalVolume,
          winRate: winRate,
          accountAge: accountAge
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setMsg('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setMsg(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}!`);
    setTimeout(() => setMsg(''), 3000);
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
          <div style={{ color: '#94a3b8' }}>Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h2 style={{ margin: 0, marginBottom: 4 }}>⚙️ Configurações</h2>
          <p className="muted" style={{ margin: 0 }}>
            Personalize sua experiência no CoinSim
          </p>
        </div>
      </div>

      {msg && (
        <div className="success-msg">
          ✓ {msg}
        </div>
      )}

      {/* Account Info Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>👤</span> Informações da Conta
        </h3>
        
        <div className="account-info-grid">
          <div className="info-item">
            <div className="info-label">Username</div>
            <div className="info-value">{user?.username || '—'}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Saldo USD</div>
            <div className="info-value" style={{ color: '#16a34a' }}>
              ${Number(user?.usd_balance || 0).toFixed(2)}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Total de Tokens</div>
            <div className="info-value">
              {user?.tokens?.length || 0} tipos
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Tipo de Conta</div>
            <div className="info-value">
              {user?.is_admin ? (
                <span style={{ color: '#fbbf24' }}>👑 Admin</span>
              ) : (
                <span>👤 Usuário</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Status</div>
            <div className="info-value">
              {user?.is_banned ? (
                <span style={{ color: '#ef4444' }}>🚫 Banido</span>
              ) : (
                <span style={{ color: '#16a34a' }}>✓ Ativo</span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Idade da Conta</div>
            <div className="info-value">{stats.accountAge} dias</div>
          </div>
        </div>
      </div>

      {/* Trading Stats Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📊</span> Estatísticas de Trading
        </h3>
        
        <div className="stats-grid-settings">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-label">Total de Trades</div>
              <div className="stat-value">{stats.totalTrades}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-label">Volume Total</div>
              <div className="stat-value">${stats.totalVolume.toFixed(2)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Win Rate</div>
              <div className="stat-value" style={{ 
                color: stats.winRate >= 50 ? '#16a34a' : '#ef4444' 
              }}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <div className="stat-label">Rank</div>
              <div className="stat-value">#{Math.floor(Math.random() * 100) + 1}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🎨</span> Aparência
        </h3>
        
        <p className="muted" style={{ marginBottom: 20 }}>
          Escolha o tema que melhor combina com você
        </p>

        <div className="theme-selector">
          {/* Dark Theme */}
          <button
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <div className="theme-preview dark-preview">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-block"></div>
                <div className="preview-block"></div>
              </div>
            </div>
            <div className="theme-info">
              <div className="theme-name">🌙 Tema Escuro</div>
              <div className="theme-desc">Perfeito para uso noturno</div>
            </div>
            {theme === 'dark' && <div className="theme-check">✓</div>}
          </button>

          {/* Light Theme */}
          <button
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <div className="theme-preview light-preview">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-block"></div>
                <div className="preview-block"></div>
              </div>
            </div>
            <div className="theme-info">
              <div className="theme-name">☀️ Tema Claro</div>
              <div className="theme-desc">Leve e moderno</div>
            </div>
            {theme === 'light' && <div className="theme-check">✓</div>}
          </button>
        </div>
      </div>

      {/* Portfolio Summary Card */}
      <div className="card">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>💼</span> Portfolio
        </h3>
        
        {user?.tokens && user.tokens.length > 0 ? (
          <div className="portfolio-list">
            {user.tokens.map((token, idx) => (
              <div key={idx} className="portfolio-item">
                <div className="token-symbol">{token.symbol}</div>
                <div className="token-info">
                  <div className="token-name">{token.name}</div>
                  <div className="token-amount">{Number(token.amount).toLocaleString()} tokens</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div>Você ainda não possui tokens</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Comece fazendo trades no Market!</div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card danger-zone">
        <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444' }}>
          <span>⚠️</span> Zona de Perigo
        </h3>
        
        <p className="muted" style={{ marginBottom: 16 }}>
          Ações irreversíveis que afetam sua conta
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            className="btn danger-btn"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja resetar seu saldo para $1000?')) {
                // TODO: Implementar endpoint de reset
                alert('Feature em desenvolvimento');
              }
            }}
          >
            🔄 Resetar Conta
          </button>

          <button 
            className="btn danger-btn"
            onClick={() => {
              if (window.confirm('Tem certeza? Isso irá deletar TODOS os seus dados permanentemente!')) {
                // TODO: Implementar endpoint de delete
                alert('Feature em desenvolvimento');
              }
            }}
          >
            🗑️ Deletar Conta
          </button>
        </div>
      </div>
    </div>
  );
}
