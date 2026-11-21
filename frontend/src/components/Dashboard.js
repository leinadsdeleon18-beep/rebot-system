import React from 'react';
import { RefreshCw } from 'lucide-react';
import './Dashboard.css';

const numbers = new Intl.NumberFormat();

export function DashboardHeader({ title, description, children }) {
  return (
    <header className="rb-dash-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="rb-dash-actions">{children}</div>}
    </header>
  );
}

export function DashboardRefresh({ busy, onClick }) {
  return (
    <button type="button" className="rb-dash-button" disabled={busy} onClick={onClick}>
      <RefreshCw size={16} aria-hidden="true" className={busy ? 'rb-dash-spin' : undefined} />
      {busy ? 'Refreshing…' : 'Refresh'}
    </button>
  );
}

export function DashboardMetrics({ items, label = 'Dashboard totals' }) {
  return (
    <dl className="rb-dash-metrics" aria-label={label}>
      {items.map(({ label, value, icon: Icon, primary, detail }) => (
        <div key={label} className={primary ? 'rb-dash-metric is-primary' : 'rb-dash-metric'}>
          <dt><Icon size={19} aria-hidden="true" /> {label}</dt>
          <dd>{typeof value === 'number' ? numbers.format(value) : value ?? '0'}{detail && <small>{detail}</small>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DashboardPanel({ title, description, action, children, className = '' }) {
  return (
    <section className={'rb-dash-panel ' + className}>
      <div className="rb-dash-panel-header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardEmpty({ icon: Icon, title, children }) {
  return (
    <div className="rb-dash-empty">
      {Icon && <Icon size={24} aria-hidden="true" />}
      <p><strong>{title}</strong></p>
      {children && <p>{children}</p>}
    </div>
  );
}
