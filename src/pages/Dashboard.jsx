import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// 1. STATIC HISTORICAL DATA LEDGER
// ==========================================
const STATIC_HISTORY = {
  'NODE1': [
    { daysAgo: 6, distance: 132.5, fuelUsed: 7.2 }, { daysAgo: 5, distance: 118.0, fuelUsed: 6.4 },
    { daysAgo: 4, distance: 145.2, fuelUsed: 8.1 }, { daysAgo: 3, distance: 95.8,  fuelUsed: 5.3 },
    { daysAgo: 2, distance: 122.4, fuelUsed: 6.8 }, { daysAgo: 1, distance: 110.5, fuelUsed: 6.1 },
    { daysAgo: 0, distance: 128.6, fuelUsed: 7.1 }
  ],
  'NODE2': [ 
    { daysAgo: 6, distance: 85.4, fuelUsed: 7.1 }, { daysAgo: 5, distance: 92.1, fuelUsed: 7.8 },
    { daysAgo: 4, distance: 78.5, fuelUsed: 6.5 }, { daysAgo: 3, distance: 105.2, fuelUsed: 8.9 },
    { daysAgo: 2, distance: 88.0, fuelUsed: 7.3 }, { daysAgo: 1, distance: 94.6, fuelUsed: 7.9 },
    { daysAgo: 0, distance: 82.3, fuelUsed: 6.9 }
  ],
  'NODE3': [ 
    { daysAgo: 6, distance: 210.5, fuelUsed: 14.2 }, { daysAgo: 5, distance: 195.2, fuelUsed: 13.1 },
    { daysAgo: 4, distance: 225.8, fuelUsed: 15.0 }, { daysAgo: 3, distance: 180.4, fuelUsed: 12.0 },
    { daysAgo: 2, distance: 205.6, fuelUsed: 13.8 }, { daysAgo: 1, distance: 198.9, fuelUsed: 13.4 },
    { daysAgo: 0, distance: 215.0, fuelUsed: 14.5 }
  ]
};

// ==========================================
// 2. SMOOTH UI ANIMATION ENGINE
// ==========================================
function useAnimatedNumber(endValue, duration = 500) {
  const [value, setValue] = useState(endValue || 0);
  const prevEndValue = useRef(endValue || 0);

  useEffect(() => {
    if (endValue === prevEndValue.current) return;
    let startTimestamp = null;
    const startValue = value;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(Number((progress * (endValue - startValue) + startValue).toFixed(2)));
      if (progress < 1) window.requestAnimationFrame(step);
      else prevEndValue.current = endValue;
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration, value]);
  return value;
}

// ==========================================
// 3. MAIN OMNI FLEET DASHBOARD COMPONENT
// ==========================================
export default function Dashboard() {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState('NODE1');
  const [activeTab, setActiveTab] = useState('live');
  
  // State for the 7-second auto-dismissing notifications
  const [toasts, setToasts] = useState([]);

  // Log to track chronic issues
  const incidentLog = useRef({ hardBrakes: 0, potholes: 0 });

  // --- NEW: CLEAR TOASTS ON NODE CHANGE ---
  // This forcefully wipes the screen clean if you switch vehicles
  useEffect(() => {
    setToasts([]);
  }, [selectedNode]);

  // --- AWS LIVE DATA ENGINE & PRESENTATION SIMULATOR ---
  useEffect(() => {
    setLoading(true);
    const awsApiUrl = `https://jxn3qumbrd.execute-api.ap-south-1.amazonaws.com/data?device_id=${selectedNode}`;

    const fetchAwsData = () => {
      fetch(awsApiUrl)
        .then(res => res.ok ? res.json() : Promise.reject('Network error'))
        .then(data => {
          if (data && data.length > 0) {
            // PURE DATA INJECTION: Exactly what is in AWS shows on screen.
            const incomingData = data[0];
            setVehicleData({
              device_id: selectedNode,
              speed: incomingData.velocity || 0,
              rpm: incomingData.rpm || 0,
              engineLoad: incomingData.load || 0,
              temperature: incomingData.temperature || 0,
              fuel: incomingData.fuel || 0,
              ax: incomingData.ax || 0.0,
              ay: incomingData.ay || 0.0,
              az: incomingData.az || 1.0,
              voltage: incomingData.voltage || 14.2,
              isOnline: true,
              datetime: incomingData.timestamp || 'Live Sync'
            });
          } else {
             // SIMULATOR: ONLY triggers if your AWS database is empty for this node
             let profile = { speed: Math.floor(Math.random() * (75 - 65 + 1)) + 65, rpm: 2400, engineLoad: 42, temperature: 90, fuel: 82, voltage: 14.2 };

             if (selectedNode === 'NODE2') profile = { speed: 45, rpm: 4200, engineLoad: 45, temperature: 105, fuel: 65, voltage: 14.1 };
             else if (selectedNode === 'NODE3') profile = { speed: 135, rpm: 3200, engineLoad: 92, temperature: 94, fuel: 30, voltage: 11.5 };

             setVehicleData({
              device_id: selectedNode, speed: profile.speed, rpm: profile.rpm, engineLoad: profile.engineLoad,
              temperature: profile.temperature, fuel: profile.fuel, voltage: profile.voltage,
              ax: (Math.random() * 0.2 - 0.1).toFixed(2), ay: (Math.random() * 0.3 - 0.15).toFixed(2), 
              az: (Math.random() * 0.1 + 0.95).toFixed(2), isOnline: true, datetime: 'Simulated Sync'
            });
          }
          setLoading(false);
        })
        .catch(err => { 
          // OFFLINE FALLBACK
          setVehicleData({
            device_id: selectedNode, speed: 68, rpm: 2400, engineLoad: 42, temperature: 90, fuel: 82,
            ax: 0, ay: 0, az: 1, isOnline: false, datetime: 'Offline'
          });
          setLoading(false); 
        });
    };

    fetchAwsData();
    const intervalId = setInterval(fetchAwsData, 5000);
    return () => clearInterval(intervalId);
  }, [selectedNode]);

  // --- FLOATING TOAST NOTIFICATION MANAGER (7-SECOND LIFECYCLE) ---
  useEffect(() => {
    if (!vehicleData || !vehicleData.isOnline) return;

    const triggerToast = (msg, level) => {
      setToasts(prev => {
        if (prev.some(t => t.text === msg)) return prev;
        const newToast = { id: Date.now() + Math.random(), text: msg, level };
        return [...prev, newToast];
      });
    };

    if (vehicleData.speed > 120) triggerToast('🚨 HIGH SPEED: Over 120 km/h detected!', 'critical');
    if (vehicleData.temperature > 100) triggerToast('🔥 HIGH TEMP: Engine overheating!', 'critical');
    if (vehicleData.rpm >= 3500 && vehicleData.speed < 60) triggerToast('🚨 HIGH RPM: Transmission Strain Detected', 'warning');
    if (vehicleData.engineLoad > 85) triggerToast('⚠️ HIGH LOAD: Excessive engine stress', 'warning');
    if (vehicleData.voltage < 12.0 && vehicleData.rpm > 0) triggerToast('⚡ LOW BATTERY: Alternator failing', 'critical');

  }, [vehicleData]);

  // The 7-Second Auto-Dismiss Timer
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // --- 🧠 MATHEMATICAL RANGE CALCULATOR ---
  const calculateDynamicMetrics = (data, node) => {
    if (!data) return { currentMileage: 0, estimatedRange: 0 };
    const TANK_CAPACITY_LITERS = 50; 
    const remainingFuelLiters = (data.fuel / 100) * TANK_CAPACITY_LITERS;
    let dynamicMileage = node === 'NODE1' ? 18.0 : node === 'NODE2' ? 12.0 : 15.0;

    if (data.speed > 90) dynamicMileage -= (data.speed - 90) * 0.1; 
    if (data.rpm > 2500) dynamicMileage -= (data.rpm - 2500) * 0.002; 
    if (data.engineLoad > 60) dynamicMileage -= (data.engineLoad - 60) * 0.05; 
    dynamicMileage = Math.max(5.0, dynamicMileage);
    if (data.speed === 0 && data.rpm > 0) dynamicMileage = 0; 
    return { currentMileage: dynamicMileage.toFixed(1), estimatedRange: Math.round(remainingFuelLiters * dynamicMileage) };
  };

  const liveMetrics = calculateDynamicMetrics(vehicleData, selectedNode);

  // --- 🛡️ STATIC ACTIVE SHIELD LOG (BOTTOM CARD) ---
  const generateInsights = (data) => {
    if (!data) return [];
    let insights = [];

    if (data.speed > 120) insights.push({ level: 'critical', text: '🚨 CRITICAL: Speed limit violation detected.' });
    if (parseInt(data.temperature) > 100) insights.push({ level: 'critical', text: '🔥 CRITICAL: Engine Overheating.' });
    if (data.rpm >= 3500 && data.speed < 60) insights.push({ level: 'warning', text: '⚠️ ALERT: High RPM & Low Speed (Transmission Strain).' });
    if (data.engineLoad > 85) insights.push({ level: 'warning', text: '⚠️ ALERT: Excessive Engine Load detected.' });
    if (data.voltage < 12.0 && data.rpm > 0) insights.push({ level: 'critical', text: '⚡ PREDICTIVE: Battery/Alternator failure imminent.' });

    if (parseFloat(data.az) > 1.8) insights.push({ level: 'warning', text: '⚠️ SUSPENSION: High vertical impact detected.' });
    if (parseFloat(data.ax) < -0.6) insights.push({ level: 'warning', text: '💥 HARSH EVENT: Severe deceleration logged.' });

    if (insights.length === 0) {
      insights.push({ level: 'optimal', text: '✅ All telemetry & kinematic arrays nominal.' });
    }
    
    return insights;
  };

  const getConstantHistory = (node) => {
    const rawData = STATIC_HISTORY[node] || STATIC_HISTORY['NODE1'];
    let totalDist = 0, totalFuel = 0, history = [];
    rawData.forEach(entry => {
      const date = new Date(); date.setDate(date.getDate() - entry.daysAgo);
      totalDist += entry.distance; totalFuel += entry.fuelUsed;
      history.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        distance: entry.distance.toFixed(1), fuelUsed: entry.fuelUsed.toFixed(1), mileage: (entry.distance / entry.fuelUsed).toFixed(1)
      });
    });
    return { history: history.reverse(), totalDist: totalDist.toFixed(1), totalFuel: totalFuel.toFixed(1), avgMileage: (totalDist / totalFuel).toFixed(1) };
  };

  const tripData = getConstantHistory(selectedNode);

  const animSpeed = useAnimatedNumber(vehicleData ? parseInt(vehicleData.speed) : 0);
  const animRPM = useAnimatedNumber(vehicleData ? parseInt(vehicleData.rpm) : 0);
  const animFuel = useAnimatedNumber(vehicleData ? parseInt(vehicleData.fuel) : 0);
  const animTemp = useAnimatedNumber(vehicleData ? parseInt(vehicleData.temperature) : 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: '#0ea5e9' }}>
      Connecting to Omni Fleet Servers...
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', width: '100%', fontFamily: '"Inter", system-ui, sans-serif',
      background: 'radial-gradient(circle at top right, #1e1b4b 0%, #09090b 40%, #000000 100%)',
      color: '#e2e8f0', padding: '30px 0', overflowX: 'hidden', position: 'relative'
    }}>
      
      <style>{`
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes slideIn { 0% { transform: translateX(120%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
        .nav-btn { padding: 10px 25px; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; font-size: 0.95rem; }
        .nav-btn.active { background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%); color: white; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4); }
        .nav-btn.inactive { background: rgba(255,255,255,0.05); color: #94a3b8; }
        .gradient-text { background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .g-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); position: relative; overflow: hidden; margin-top: 5px; }
        .g-fill { height: 100%; position: absolute; transition: width 0.3s ease, left 0.3s ease; }
        .history-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
      `}</style>

      {/* FLOATING TOAST NOTIFICATION SYSTEM (7 Second Time Span) */}
      {toasts.length > 0 && activeTab === 'live' && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {toasts.map((alert) => (
            <div key={alert.id} style={{ 
              background: alert.level === 'critical' ? 'rgba(244, 63, 94, 0.95)' : 'rgba(245, 158, 11, 0.95)', 
              color: '#fff', padding: '15px 25px', borderRadius: '8px', 
              fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
              animation: 'slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              {alert.text}
            </div>
          ))}
        </div>
      )}

      <div style={{ width: '100%', padding: '0 3vw', boxSizing: 'border-box' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="gradient-text" style={{ margin: 0, fontSize: '3rem', fontWeight: '800', lineHeight: '1.2', paddingBottom: '5px' }}>
              Omni Fleet
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: vehicleData.isOnline ? '#10b981' : '#f59e0b', animation: vehicleData.isOnline ? 'pulse-green 2s infinite' : 'none' }}></div>
              <span style={{ color: vehicleData.isOnline ? '#10b981' : '#f59e0b', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                {vehicleData.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '5px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button className={`nav-btn ${activeTab === 'live' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('live')}>Live Telemetry</button>
            <button className={`nav-btn ${activeTab === 'analytics' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('analytics')}>Trip Analytics</button>
          </div>

          <select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)} style={{ padding: '12px 25px', fontSize: '1rem', borderRadius: '30px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <option value="NODE1" style={{ color: '#000' }}>Vehicle 01 (Alpha)</option>
            <option value="NODE2" style={{ color: '#000' }}>Vehicle 02 (Beta)</option>
            <option value="NODE3" style={{ color: '#000' }}>Vehicle 03 (Gamma)</option>
          </select>
        </div>

        {/* TAB 1: LIVE TELEMETRY - WIDESCREEN GRID */}
        {activeTab === 'live' && vehicleData && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '25px' }}>
              
              <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Velocity</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <h1 style={{ margin: 0, fontSize: '5rem', fontWeight: '700', color: vehicleData.speed > 120 ? '#f43f5e' : '#fff', lineHeight: '1' }}>{animSpeed}</h1>
                  <span style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: '600' }}>km/h</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div className="glass-card" style={{ padding: '25px', flex: 1 }}>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Engine RPM</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: vehicleData.rpm >= 3500 ? '#f59e0b' : '#e2e8f0' }}>{animRPM} <span style={{ fontSize: '1rem', color: '#64748b' }}>REV</span></h1>
                </div>
                <div className="glass-card" style={{ padding: '25px', flex: 1 }}>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Engine Load</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: vehicleData.engineLoad > 85 ? '#f43f5e' : '#e2e8f0' }}>{vehicleData.engineLoad} <span style={{ fontSize: '1rem', color: '#64748b' }}>%</span></h1>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Core Temperature</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', fontWeight: '700', color: vehicleData.temperature > 95 ? '#f43f5e' : '#fff' }}>
                    {animTemp} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>°C</span>
                  </h1>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fuel Reserve</h4>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: vehicleData.fuel < 15 ? '#f43f5e' : '#fff' }}>{animFuel}%</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${animFuel}%`, background: vehicleData.fuel < 15 ? '#f43f5e' : 'linear-gradient(90deg, #38bdf8, #8b5cf6)', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', marginBottom: '25px' }}>
              
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>Dynamic Range Analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Live Est. Range</p>
                    <h2 style={{ margin: 0, color: '#38bdf8' }}>{liveMetrics.estimatedRange} <span style={{ fontSize: '1rem', color: '#64748b' }}>km</span></h2>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Current Mileage</p>
                    <h2 style={{ margin: 0, color: '#10b981' }}>{liveMetrics.currentMileage} <span style={{ fontSize: '1rem', color: '#64748b' }}>km/L</span></h2>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Kinematics
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>MPU-6050</span>
                </h3>
                
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <span>X-Axis (Braking)</span>
                    <span style={{ color: parseFloat(vehicleData.ax) < -0.6 ? '#f43f5e' : '#fff' }}>{vehicleData.ax} G</span>
                  </div>
                  <div className="g-bar"><div className="g-fill" style={{ width: `${Math.min(Math.abs(vehicleData.ax) * 33, 100)}%`, left: vehicleData.ax < 0 ? '50%' : '50%', background: vehicleData.ax < 0 ? '#f43f5e' : '#10b981', transform: vehicleData.ax < 0 ? 'translateX(-100%)' : 'none' }}></div></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <span>Y-Axis (Cornering)</span>
                    <span style={{ color: Math.abs(parseFloat(vehicleData.ay)) > 0.5 ? '#f59e0b' : '#fff' }}>{vehicleData.ay} G</span>
                  </div>
                  <div className="g-bar"><div className="g-fill" style={{ width: `${Math.min(Math.abs(vehicleData.ay) * 50, 50)}%`, left: '50%', background: '#f59e0b', transform: vehicleData.ay < 0 ? 'translateX(-100%)' : 'none' }}></div></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <span>Z-Axis (Vertical)</span>
                    <span style={{ color: parseFloat(vehicleData.az) > 1.8 ? '#f43f5e' : '#fff' }}>{vehicleData.az} G</span>
                  </div>
                  <div className="g-bar"><div className="g-fill" style={{ width: `${Math.min((parseFloat(vehicleData.az) / 2) * 100, 100)}%`, left: 0, background: '#38bdf8' }}></div></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Active Shield Log</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  {generateInsights(vehicleData).map((insight, index) => {
                    const colors = {
                      critical: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.5)', text: '#fb7185' },
                      warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
                      optimal: { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.2)', text: '#34d399' }
                    };
                    const theme = colors[insight.level];
                    return (
                      <div key={index} style={{ 
                        padding: '20px', borderRadius: '12px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                        color: theme.text, fontSize: '0.95rem', lineHeight: '1.5', display: 'flex', gap: '15px', alignItems: 'flex-start'
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.text, marginTop: '5px', flexShrink: 0 }}></div>
                        {insight.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: TRIP ANALYTICS */}
        {activeTab === 'analytics' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem' }}>Monthly Average Mileage</h4>
                <h1 className="gradient-text" style={{ margin: '10px 0 0 0', fontSize: '3.5rem' }}>{tripData.avgMileage} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>km/L</span></h1>
              </div>
              <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Distance (7 Days)</h4>
                <h1 style={{ margin: '10px 0 0 0', fontSize: '3.5rem', color: '#e2e8f0' }}>{tripData.totalDist} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>km</span></h1>
              </div>
              <div className="glass-card" style={{ padding: '25px', textAlign: 'center' }}>
                <h4 style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem' }}>Total Fuel Consumed</h4>
                <h1 style={{ margin: '10px 0 0 0', fontSize: '3.5rem', color: '#e2e8f0' }}>{tripData.totalFuel} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>L</span></h1>
              </div>
            </div>
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>Daily Log & Performance Ledger</h3>
              </div>
              <div className="history-row" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <div>Date</div><div>Distance Traveled</div><div>Fuel Used</div><div>Daily Mileage</div>
              </div>
               {tripData.history.map((log, index) => (
                <div key={index} className="history-row" style={{ color: '#e2e8f0', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.15)' }}>
                  <div style={{ color: '#38bdf8', fontWeight: '600' }}>{log.date}</div><div>{log.distance} km</div><div>{log.fuelUsed} L</div><div style={{ color: '#10b981', fontWeight: 'bold' }}>{log.mileage} km/L</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
