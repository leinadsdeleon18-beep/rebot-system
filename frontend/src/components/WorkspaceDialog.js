import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './WorkspaceDialog.css';

export default function WorkspaceDialog({ title, subtitle, className = '', busy = false, onClose, onSubmit, children, actions }) {
  const dialog = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    element.querySelector('[data-dialog-focus]')?.focus();
    return () => element.close();
  }, []);

  const Content = onSubmit ? 'form' : 'div';

  return (
    <dialog ref={dialog} className={'rb-workspace-dialog ' + className} aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault();
        if (!busy) onClose();
      }}>
      <header className="rb-dialog-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="rb-dialog-close" type="button" aria-label="Close dialog" onClick={onClose} disabled={busy}>
          <X size={19} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </header>
      <Content onSubmit={onSubmit ? event => {
        event.preventDefault();
        if (!busy) onSubmit();
      } : undefined}>
        <div className="rb-dialog-body">{children}</div>
        {actions && <footer className="rb-dialog-actions">{actions}</footer>}
      </Content>
    </dialog>
  );
}
