import React, { useState } from 'react';
import * as api from '../api';
import { useTranslation } from 'react-i18next';

export default function Auth({ onLogin }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const res = await api.login(username, password);
      if (res && res.token) {
        onLogin(res.token);
        setMsg(t('loggedIn'));
      } else {
        setMsg(res.error || t('errorGeneric'));
      }
    } catch (e) {
      setMsg(e.message || t('errorGeneric'));
    }
  }

  return (
    <div className="auth card">
      <h2>{t('login')}</h2>
      <form onSubmit={submit}>
        <input
          placeholder={t('usernamePlaceholder')}
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          placeholder={t('passwordPlaceholder')}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {t('submitLogin')}
        </button>
      </form>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          📱 <strong>Registration is only available on the website:</strong><br />
          <a 
            href="https://rugplicate.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            https://rugplicate.vercel.app
          </a>
        </p>
      </div>
      
      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
