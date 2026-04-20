import React from 'react';

function Alerts() {
  return (
    <div>
      <h2>System Alerts</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '10px', borderRadius: '4px' }}>
          <strong>⚠️ 10:42 AM:</strong> Minor vibration anomaly detected (SW-420 Sensor).
        </li>
        <li style={{ padding: '15px', backgroundColor: '#dcfce3', color: '#166534', borderRadius: '4px' }}>
          <strong>✅ 09:00 AM:</strong> System boot successful. MQTT connection established.
        </li>
      </ul>
    </div>
  );
}

export default Alerts;