import React from 'react';

export default function Gambling({ onBack, onActionComplete }) {
  return (
    <div className="card danger-zone">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Gambling — IMPORTANT</h2>
        <div>
          <button className="btn ghost" onClick={onBack}>Back</button>
        </div>
      </div>
      <p style={{ marginBottom: 12 }}>
        This area contains high-risk gambling features. Users should understand the risks before participating. Use responsibly and within your limits.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={() => onActionComplete && onActionComplete({ animate: { amount: -5, type: 'down' } })}>Try (example)</button>
        <button className="btn ghost" onClick={() => onActionComplete && onActionComplete({ animate: { amount: 5, type: 'up' } })}>Win (example)</button>
      </div>
    </div>
  );
}
