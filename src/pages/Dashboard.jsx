import React, { useState, useEffect, useRef } from 'react';

// 1. The Animation Hook: Smoothly rolls numbers up/down
function useAnimatedNumber(endValue, duration = 500) {
  const [value, setValue] = useState(endValue || 0);
  const prevEndValue = useRef(endValue || 0);

  useEffect(() => {
    if (endValue === prevEndValue.current) return;
    
    let startTimestamp = null;
    const startValue = value;
    const targetValue = endValue;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setValue(Math.floor(progress * (targetValue - startValue) + startValue));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        prevEndValue.current = targetValue;
      }
    };
    
    window.requestAnimationFrame(step);
  }, [endValue, duration, value]);

  return value;
}

export default function Dashboard() {
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Attach the animation engine to the AWS data points
  // We parse the AWS strings into numbers safely
  const animatedFuel = useAnimatedNumber(vehicleData ? parseInt(vehicleData.fuel) : 0);
  const animatedTemp = useAnimatedNumber(vehicleData ? parseInt(vehicleData.temperature) : 0);

  // 3. The Auto-Polling AWS Engine
  useEffect(() => {
    // Directly linked to your live AWS API Gateway
    const awsApiUrl = 'https://jxn3qumbrd.execute-api.ap-south-1.amazonaws.com/data?device_id=NODE1';

    const fetchAwsData = () => {
      fetch(awsApiUrl)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          // AWS returns an array (e.g., [ { device_id: "NODE1"... } ])
          // We capture the first item (data[0])
          if (data && data.length > 0) {
            setVehicleData(data[0]);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error("AWS Fetch Error:", error);
          setLoading(false);
        });
    };

    // Run immediately when the page opens
    fetchAwsData();
    
    // Set up the loop to run every 2000 milliseconds (2 seconds)
    const intervalId = setInterval(fetchAwsData, 2000);

    // Clean up the loop if the user navigates to another page
    return () => clearInterval(intervalId);
  }, []);

  // 4. Loading States
  if (loading) return <h3 style={{ color: '#f8fafc' }}>Fetching live data from AWS for NODE1...</h3>;
  if (!vehicleData) return <h3 style={{ color: '#f59e0b' }}>No data found in AWS. Check ESP32 connection.</h3>;

  // 5. The User Interface
  return (
    <div>
      {/* Header section */}
      <div style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ color: '#f8fafc', margin: 0 }}>Real-Time Sensor Diagnostics</h2>
        <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Monitoring: <strong style={{ color: '#38bdf8' }}>{vehicleData.device_id}</strong></p>
      </div>

      {/* Dynamic Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Animated Fuel Card */}
        <div style={{ padding: '20px', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b', borderLeft: '5px solid #3b82f6' }}>
          <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>Fuel Level</h4>
          <h1 style={{ margin: '10px 0 0 0', color: '#f8fafc' }}>
            {animatedFuel} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>%</span>
          </h1>
        </div>

        {/* Animated Temperature Card */}
        <div style={{ padding: '20px', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b', borderLeft: '5px solid #ef4444' }}>
          <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>Temperature</h4>
          {/* Automatically turns red if temperature exceeds 40°C */}
          <h1 style={{ margin: '10px 0 0 0', color: vehicleData.temperature > 40 ? '#ef4444' : '#f8fafc' }}>
            {animatedTemp} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>°C</span>
          </h1>
        </div>

        {/* System Sync Card */}
        <div style={{ padding: '20px', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b', borderLeft: '5px solid #10b981' }}>
          <h4 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>System Sync</h4>
          <h2 style={{ margin: '10px 0 5px 0', color: '#22c55e', fontSize: '1.2rem' }}>Online</h2>
          {/* Displays the datetime straight from the AWS JSON */}
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{vehicleData.datetime}</p>
        </div>

      </div>
    </div>
  );
}