import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Alerts from './pages/Alerts';

function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Navigation Bar */}
        <nav style={{ padding: '15px', backgroundColor: '#1e293b', color: 'white', display: 'flex', gap: '20px' }}>
          <h2 style={{ margin: '0 20px 0 0' }}>Vehicle Telematics</h2>
          <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', alignSelf: 'center' }}>Dashboard</Link>
          <Link to="/map" style={{ color: '#38bdf8', textDecoration: 'none', alignSelf: 'center' }}>Live Map</Link>
          <Link to="/alerts" style={{ color: '#38bdf8', textDecoration: 'none', alignSelf: 'center' }}>Alerts</Link>
        </nav>

        {/* Page Content */}
        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;