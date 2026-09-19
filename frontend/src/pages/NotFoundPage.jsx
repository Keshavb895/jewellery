import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <small>404 ERROR</small>
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist or has been relocated.</p>
      <Link to="/" className="button dark">
        RETURN TO HOME
      </Link>
    </main>
  );
}
