import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminLocali from './pages/AdminLocali';
import AdminVini from './pages/AdminVini';
import AdminPiatti from './pages/AdminPiatti';
import AdminConfig from './pages/AdminConfig';
import PublicMenu from './pages/PublicMenu';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1 style={{ color: '#992235', fontSize: '3rem' }}>WineLink</h1>
      <p>Connessioni di Gusto</p>
      <Link to="/admin" style={{ padding: '10px 20px', background: '#992235', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        ENTRA NELL'ADMIN
      </Link>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isPublic = location.pathname.startsWith('/menu/');

  return (
    <div style={{ minHeight: '100vh' }}>
      {!isPublic && (
        <nav style={{ padding: '15px', background: '#992235', color: 'white', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>🍷 WineLink</Link>
          <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>🏢 Locali</Link>
          <Link to="/admin/vini" style={{ color: 'white', textDecoration: 'none' }}>🍾 Vini</Link>
          <Link to="/admin/piatti" style={{ color: 'white', textDecoration: 'none' }}>🍝 Piatti</Link>
          <Link to="/admin/config" style={{ color: 'white', textDecoration: 'none' }}>⚙️ Config</Link>
        </nav>
      )}
      <div style={{ maxWidth: isPublic ? '100%' : '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminLocali />} />
          <Route path="/admin/vini" element={<AdminVini />} />
          <Route path="/admin/piatti" element={<AdminPiatti />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/menu/:slug" element={<PublicMenu />} />
        </Routes>
      </div>
    </div>
  );
}
export default App;