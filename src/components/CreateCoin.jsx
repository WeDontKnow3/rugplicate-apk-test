import React, { useEffect, useState } from 'react';
import * as api from '../api';
import { useTranslation } from 'react-i18next';

export default function CreateCoin({ onCreated }) {
  const { t } = useTranslation();

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [myBalance, setMyBalance] = useState(null);
  const [logoData, setLogoData] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const REQUIRED = 1100.0;

  async function loadMe() {
    try {
      const r = await api.getMe();
      if (r && r.user) {
        setMyBalance(Number(r.user.usd_balance));
      } else {
        setMyBalance(null);
        console.warn('getMe returned invalid:', r);
      }
    } catch (e) {
      setMyBalance(null);
      console.error('getMe threw:', e);
    }
  }

  useEffect(() => { loadMe(); }, []);

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setLogoData(null);
      setLogoPreview(null);
      return;
    }

    if (file.size > 1.6 * 1024 * 1024) {
      setMsg(t('fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoData(reader.result);
      setLogoPreview(reader.result);
    };
    reader.onerror = (err) => {
      console.error('file read error', err);
      setMsg(t('fileReadError'));
    };
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setMsg('');

    if (!symbol || !name) {
      setMsg(t('fillSymbolName'));
      return;
    }

    if (myBalance === null) {
      setMsg(t('balanceUnknown'));
      return;
    }

    if (myBalance < REQUIRED) {
      setMsg(t('insufficientBalanceCreate', { required: REQUIRED.toFixed(2) }));
      return;
    }

    setLoading(true);

    try {
      const payload = { symbol, name };
      if (logoData) payload.logoData = logoData;

      const res = await api.createCoin(payload);

      if (res && res.ok) {
        setMsg(t('coinCreatedMsg'));
        setSymbol('');
        setName('');
        setLogoData(null);
        setLogoPreview(null);
        await loadMe();

        if (onCreated) {
          onCreated({
            animate: { amount: 1100.0, type: 'down' }
          });
        }
      } else {
        console.error('createCoin error:', res);
        setMsg(res?.error || t('createCoinError'));
      }
    } catch (err) {
      console.error('createCoin threw:', err);
      setMsg(t('networkCreateError'));
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || (myBalance !== null && myBalance < REQUIRED);

  return (
    <div className="card">
      <h2>{t('createCoinTitle')}</h2>

      <form onSubmit={submit}>
        <input
          placeholder={t('symbolPlaceholder')}
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          required
        />

        <input
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div style={{ marginTop:10, marginBottom:8 }}>
          <label
            style={{
              fontSize:13,
              color:'#bfc7d6',
              display:'block',
              marginBottom:6
            }}
          >
            {t('logoLabel')}
          </label>

          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {logoPreview && (
              <img
                src={logoPreview}
                alt="preview"
                style={{
                  width:48,
                  height:48,
                  objectFit:'cover',
                  borderRadius:8,
                  border:'1px solid rgba(255,255,255,0.06)'
                }}
              />
            )}
          </div>
        </div>

        <p style={{ fontSize:12, color:'#bfc7d6' }}>
          {t('createCostText')}
        </p>

        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
          <button className="btn" type="submit" disabled={disabled}>
            {loading ? t('loading') : t('createButton')}
          </button>

          <button
            type="button"
            className="btn ghost"
            onClick={loadMe}
          >
            {t('refreshBalance')}
          </button>

          <div style={{ marginLeft:'auto', color:'#cbd5e1', fontSize:13 }}>
            {t('balanceLabel', {
              balance:
                myBalance === null
                  ? '—'
                  : `$${Number(myBalance).toFixed(2)}`
            })}
          </div>
        </div>
      </form>

      {msg && <p className="msg">{msg}</p>}

      {myBalance !== null && myBalance < REQUIRED && (
        <p className="msg">{t('insufficientBalanceNotice')}</p>
      )}
    </div>
  );
}
