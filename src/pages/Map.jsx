import React from 'react';

function MapPage() {
  return (
    <div>
      <h2>Live GPS Tracking</h2>
      <div style={{ height: '400px', width: '100%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
        <p style={{ color: '#64748b' }}>Map integration (Leaflet.js) will render here based on NEO-6M coordinates.</p>
      </div>
    </div>
  );
}

export default MapPage;