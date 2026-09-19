import React from "react";
import { Link } from "react-router-dom";

export function EmptyState({ icon: Icon, title, message, actionText = "Continue Shopping", actionLink = "/shop", onAction }) {
  return (
    <div className="empty-state">
      {Icon && <div className="empty-icon"><Icon size={44} /></div>}
      <h2>{title}</h2>
      <p>{message}</p>
      {onAction ? (
        <button type="button" onClick={onAction} className="button dark">
          {actionText}
        </button>
      ) : actionLink ? (
        <Link to={actionLink} className="button dark">
          {actionText}
        </Link>
      ) : null}
    </div>
  );
}
