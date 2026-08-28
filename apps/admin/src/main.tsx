import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function AdminShell() {
  return (
    <main>
      <p className="label">TOLK OG LÆR</p>
      <h1>Innholdsadministrasjon</h1>
      <p>Adminflaten aktiveres når autentisering og rollemodell er implementert.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminShell />
  </StrictMode>,
);
