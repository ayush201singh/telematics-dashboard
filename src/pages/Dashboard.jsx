import React, { useState, useEffect, useRef } from 'react';

// --- ANIMATION ENGINE ---
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
      setValue(Math.floor(progress * (endValue - startValue) + startValue));
      if (progress < 1) window.requestAnimationFrame(step);
      else prevEndValue.current = endValue;
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration, value]);
  return value;
}

export default function Dashboard() {
  // --- STATE MANAGEMENT ---
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState('NODE1');
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'analytics'

  // --- AWS LIVE DATA ENGINE ---
  useEffect(() => {
    setLoading(true);
    const awsApiUrl = `https://jxn3qumbrd.execute-api.ap-south-1.amazonaws.com/data?device_id=${selectedNode}`;

    const fetchAwsData = () => {
      fetch(awsApiUrl)
        .then(res => res.ok ? res.json() : Promise.reject('Network error'))
        .then(data => {
          if (data && data.length > 0) {
            const incomingData = data[0];
            setVehicleData({
              ...incomingData,
              speed: incomingData.speed || Math.floor(Math.random() * (80 - 40) + 40),
              rpm: incomingData.rpm || Math.floor(Math.random() * (3500 - 2000) + 2000),
              engineLoad: incomingData.engineLoad || Math.floor(Math.random() * (80 - 20) + 20)
            });
          } else setVehicleData(null);
          setLoading(false);
        })
        .catch(err => { console.error(err); setLoading(false); });
    };

    fetchAwsData();
    const intervalId = setInterval(fetchAwsData, 2000);
    return () => clearInterval(intervalId);
  }, [selectedNode]);

  // --- MOCK HISTORICAL DATA GENERATOR (For the Analytics Page) ---
  const generateHistory = (node) => {
    const history = [];
    let totalDist = 0;
    let totalFuel = 0;
    
    // Generate 7 days of mock data based on the selected vehicle
    for(let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Node 1 is highly efficient, Node 2 is a gas guzzler, etc.
      const baseDistance = node === 'NODE1' ? 120 : node === 'NODE2' ? 80 : 200;
      const dailyDist = baseDistance + Math.floor(Math.random() * 40 - 20);
      const fuelConsumed = dailyDist / (node === 'NODE1' ? 18 : node === 'NODE2' ? 12 : 15);
      
      totalDist += dailyDist;
      totalFuel += fuelConsumed;

      history.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        distance: dailyDist.toFixed(1),
        fuelUsed: fuelConsumed.toFixed(1),
        mileage: (dailyDist / fuelConsumed).toFixed(1)
      });
    }

    const avgMileage = (totalDist / totalFuel).toFixed(1);
    
    return { history: history.reverse(), totalDist: totalDist.toFixed(1), totalFuel: totalFuel.toFixed(1), avgMileage };
  };

  const tripData = generateHistory(selectedNode);

  // --- AI PREDICTIVE INSIGHTS ---
  const generateInsights = (data) => {
    if (!data) return [];
    let insights = [];
    if (data.rpm > 3000 && data.speed < 30 && data.engineLoad > 60) {
      insights.push({ level: 'critical', text: 'Transmission strain detected. Probable clutch slip.' });
    }
    if (parseInt(data.temperature) > 95) {
      insights.push({ level: 'critical', text: 'Thermal warning: Engine cooling system compromised.' });
    } else if (parseInt(data.temperature) > 85) {
      insights.push({ level: 'warning', text: 'Elevated core temp. Optimization suggested.' });
    }
    if (insights.length === 0) insights.push({ level: 'optimal', text: 'All telemetry arrays performing nominally.' });
    return insights;
  };

  // --- ANIMATED VALUES ---
  const animSpeed = useAnimatedNumber(vehicleData ? parseInt(vehicleData.speed) : 0);
  const animRPM = useAnimatedNumber(vehicleData ? parseInt(vehicleData.rpm) : 0);
  const animFuel = useAnimatedNumber(vehicleData ? parseInt(vehicleData.fuel) : 0);
  const animTemp = useAnimatedNumber(vehicleData ? parseInt(vehicleData.temperature) : 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: '#0ea5e9', fontSize: '1.5rem', fontFamily: 'system-ui' }}>
      Connecting to Omni Fleet Servers...
    </div>
  );

  const insights = generateInsights(vehicleData);

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      background: 'radial-gradient(circle at top right, #1e1b4b 0%, #09090b 40%, #000000 100%)',
      color: '#e2e8f0',
      padding: '30px 20px',
      overflowX: 'hidden'
    }}>
      
      {/* CSS STYLES */}
      <style>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }
        .nav-btn {
          padding: 10px 25px; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: none; font-size: 0.95rem;
        }
        .nav-btn.active {
          background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%); color: white; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
        }
        .nav-btn.inactive {
          background: rgba(255,255,255,0.05); color: #94a3b8;
        }
        .nav-btn.inactive:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .history-row {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* --- GLOBAL HEADER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse-green 2s infinite' }}></div>
              <span style={{ color: '#10b981', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>System Online</span>
            </div>
            <h1 className="gradient-text" style={{ margin: 0, fontSize: '3rem', fontWeight: '800', letterSpacing: '-1px' }}>
              Omni Fleet
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '5px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button className={`nav-btn ${activeTab === 'live' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('live')}>Live Telemetry</button>
            <button className={`nav-btn ${activeTab === 'analytics' ? 'active' : 'inactive'}`} onClick={() => setActiveTab('analytics')}>Trip Analytics</button>
          </div>

          {/* Node Selector */}
          <select 
            value={selectedNode} 
            onChange={(e) => setSelectedNode(e.target.value)}
            style={{ 
              padding: '12px 25px', fontSize: '1rem', borderRadius: '30px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', 
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', outline: 'none',
              backdropFilter: 'blur(10px)', fontWeight: '600'
            }}
          >
            <option value="NODE1" style={{ color: '#000' }}>Vehicle 01 (Alpha)</option>
            <option value="NODE2" style={{ color: '#000' }}>Vehicle 02 (Beta)</option>
            <option value="NODE3" style={{ color: '#000' }}>Vehicle 03 (Gamma)</option>
          </select>
        </div>

        {/* ========================================= */}
        {/* TAB 1: LIVE TELEMETRY             */}
        {/* ========================================= */}
        {activeTab === 'live' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {/* Hero Telemetry Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' }}>
              
              {/* Main Speedometer */}
              <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Velocity</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <h1 style={{ margin: 0, fontSize: '5rem', fontWeight: '700', color: '#fff', lineHeight: '1' }}>{animSpeed}</h1>
                  <span style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: '600' }}>km/h</span>
                </div>
              </div>

              {/* RPM & Load Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div className="glass-card" style={{ padding: '25px', flex: 1 }}>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Engine RPM</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: '#e2e8f0' }}>{animRPM} <span style={{ fontSize: '1rem', color: '#64748b' }}>REV</span></h1>
                </div>
                <div className="glass-card" style={{ padding: '25px', flex: 1 }}>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Engine Load</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem', fontWeight: '700', color: '#e2e8f0' }}>{vehicleData.engineLoad} <span style={{ fontSize: '1rem', color: '#64748b' }}>%</span></h1>
                </div>
              </div>

              {/* Vitals (Temp & Fuel) */}
              <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Core Temperature</h4>
                  <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', fontWeight: '700', color: vehicleData.temperature > 85 ? '#f43f5e' : '#fff' }}>
                    {animTemp} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>°C</span>
                  </h1>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fuel Reserve</h4>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{animFuel}%</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${animFuel}%`, background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Lower Intelligence Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' }}>
              
              {/* Session Diagnostics */}
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>Session Diagnostics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Est. Range</p>
                    <h2 style={{ margin: 0, color: '#38bdf8' }}>412 <span style={{ fontSize: '1rem', color: '#64748b' }}>km</span></h2>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Active Time</p>
                    <h2 style={{ margin: 0, color: '#10b981' }}>1h 24m</h2>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', gridColumn: 'span 2' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' }}>Last Uplink Sync</p>
                    <h3 style={{ margin: 0, color: '#e2e8f0', fontWeight: '400' }}>{vehicleData.datetime}</h3>
                  </div>
                </div>
              </div>

              {/* AI Neuro-Insights */}
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Predictive Intelligence</span>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>AI ACTIVE</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {insights.map((insight, index) => {
                    const colors = {
                      critical: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#fb7185' },
                      warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
                      optimal: { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.2)', text: '#34d399' }
                    };
                    const theme = colors[insight.level];
                    return (
                      <div key={index} style={{ 
                        padding: '20px', borderRadius: '12px', 
                        backgroundColor: theme.bg, border: `1px solid ${theme.border}`,
                        color: theme.text, fontSize: '0.95rem', lineHeight: '1.5',
                        display: 'flex', gap: '15px', alignItems: 'flex-start'
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

        {/* ========================================= */}
        {/* TAB 2: TRIP ANALYTICS             */}
        {/* ========================================= */}
        {activeTab === 'analytics' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            
            {/* Monthly Averages Overview */}
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

            {/* Daily Breakdown Ledger */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>Daily Log & Performance</h3>
              </div>
              
              {/* Table Headers */}
              <div className="history-row" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <div>Date</div>
                <div>Distance Traveled</div>
                <div>Fuel Used</div>
                <div>Daily Mileage</div>
              </div>

              {/* Table Data Rows */}
              {tripData.history.map((log, index) => (
                <div key={index} className="history-row" style={{ color: '#e2e8f0', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.15)' }}>
                  <div style={{ color: '#38bdf8', fontWeight: '600' }}>{log.date}</div>
                  <div>{log.distance} km</div>
                  <div>{log.fuelUsed} L</div>
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>{log.mileage} km/L</div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
