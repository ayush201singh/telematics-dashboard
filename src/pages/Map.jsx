import React, { useState, useEffect } from 'react';

export default function LiveMap() {
  const [coords, setCoordinates] = useState({ lat: 8.5581, lng: 76.8816, speed: 68 }); // Default to TCS Peepul Park
  const [selectedNode, setSelectedNode] = useState('NODE1');
  const [status, setStatus] = useState('Connecting...');

  // --- AWS LIVE DATA POLLING ---
  useEffect(() => {
    const fetchAwsData = () => {
      const awsApiUrl = `https://jxn3qumbrd.execute-api.ap-south-1.amazonaws.com/data?device_id=${selectedNode}`;
      fetch(awsApiUrl)
        .then(res => res.ok ? res.json() : Promise.reject('Network error'))
        .then(data => {
          if (data && data.length > 0) {
            setCoordinates({
              lat: data[0].lat || 8.5581,
              lng: data[0].lng || 76.8816,
              speed: data[0].velocity || 68
            });
            setStatus('Live GPS Sync');
          } else {
            // Simulated slight movement around the TCS campus for the demo
            setCoordinates(prev => ({
              lat: prev.lat + (Math.random() * 0.0001 - 0.00005),
              lng: prev.lng + (Math.random() * 0.0001 - 0.00005),
              speed: Math.floor(Math.random() * 10) + 65
            }));
            setStatus('Simulated Uplink');
          }
        })
        .catch(() => {
          setStatus('Offline (Cached Location)');
        });
    };

    fetchAwsData();
    const interval = setInterval(fetchAwsData, 5000);
    return () => clearInterval(interval);
  }, [selectedNode]);

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', fontFamily: '"Inter", system-ui, sans-serif',
      background: 'radial-gradient(circle at top right, #1e1b4b 0%, #09090b 40%, #000000 100%)',
      color: '#e2e8f0', padding: '30px 0', overflowX: 'hidden'
    }}>
      
      <div style={{ width: '100%', padding: '0 3vw', boxSizing: 'border-box' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Global Asset Tracking
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: status.includes('Offline') ? '#f59e0b' : '#10b981' }}></div>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{status}</span>
            </div>
          </div>

          <select 
            value={selectedNode} 
            onChange={(e) => setSelectedNode(e.target.value)} 
            style={{ padding: '12px 25px', fontSize: '1rem', borderRadius: '30px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
          >
            <option value="NODE1" style={{ color: '#000' }}>Vehicle 01 (Alpha)</option>
            <option value="NODE2" style={{ color: '#000' }}>Vehicle 02 (Beta)</option>
            <option value="NODE3" style={{ color: '#000' }}>Vehicle 03 (Gamma)</option>
          </select>
        </div>

        {/* MAP CONTAINER & TELEMETRY OVERLAY */}
        <div style={{ 
          position: 'relative', height: '70vh', width: '100%', 
          borderRadius: '20px', overflow: 'hidden', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          
          {/* FLOATING TELEMETRY OVERLAY */}
          <div style={{ 
            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
            padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: '250px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1.1rem' }}>Active Route Data</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Target Location</span>
              <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1.1rem' }}>TCS Peepul Park</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Technopark, Trivandrum</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Latitude</span>
                <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1rem' }}>{coords.lat.toFixed(5)}°</div>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Longitude</span>
                <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1rem' }}>{coords.lng.toFixed(5)}°</div>
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: '5px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Speed</span>
                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.5rem' }}>{coords.speed} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>km/h</span></div>
              </div>
            </div>
          </div>

          {/* THE FIXED GOOGLE MAPS IFRAME EMBED */}
          <iframe 
            title="Vehicle Live Map"
            width="100%" 
            height="100%" 
            style={{ border: 0 }}
            loading="lazy" 
            allowFullScreen 
            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>

      </div>
    </div>
  );
}
