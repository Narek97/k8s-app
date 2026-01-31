import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:30500/api';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stats, setStats] = useState(null);
  const [lastPod, setLastPod] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchItems();
    fetchStats();
    
    // Refresh stats every 3 seconds
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(''), 3000);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/items`);
      const result = await response.json();
      setItems(result.data || []);
      setLastPod(result.pod_name);
      setDataSource(result.source);
    } catch (err) {
      showMessage('Failed to fetch items', true);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const result = await response.json();
      
      setName('');
      setDescription('');
      showMessage(`Item added by pod: ${result.pod_name}`);
      fetchItems();
      fetchStats();
    } catch (err) {
      showMessage('Failed to add item', true);
      console.error('Error:', err);
    }
  };

  const deleteItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
      const result = await response.json();
      showMessage(`Item deleted by pod: ${result.pod_name}`);
      fetchItems();
      fetchStats();
    } catch (err) {
      showMessage('Failed to delete item', true);
      console.error('Error:', err);
    }
  };

  const crashPod = async () => {
    if (!window.confirm('Are you sure you want to crash a backend pod? Kubernetes will auto-restart it.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/crash`, { method: 'POST' });
      const result = await response.json();
      showMessage(`💥 ${result.message}`, true);
      
      // Refresh after crash
      setTimeout(() => {
        fetchItems();
        fetchStats();
      }, 3000);
    } catch (err) {
      showMessage('Pod crashed! Watch it restart...', true);
      setTimeout(() => {
        fetchItems();
        fetchStats();
      }, 3000);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch(`${API_URL}/cache/clear`, { method: 'POST' });
      const result = await response.json();
      showMessage(`Cache cleared by pod: ${result.pod_name}`);
      fetchItems();
    } catch (err) {
      showMessage('Failed to clear cache', true);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', margin: '10px 0' }}>🚀 Advanced Kubernetes App</h1>
        <p style={{ color: '#666', margin: '5px 0' }}>
          React + Node.js + PostgreSQL + Redis on Kubernetes
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          background: message.isError ? '#ffebee' : '#e8f5e9', 
          color: message.isError ? '#c62828' : '#2e7d32',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message.text}
        </div>
      )}

      {/* Statistics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ padding: '20px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>📊 Total Requests</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#0d47a1' }}>
            {stats?.total_requests || 0}
          </p>
        </div>
        
        <div style={{ padding: '20px', background: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>📦 Total Items</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#4a148c' }}>
            {stats?.total_items || 0}
          </p>
        </div>
        
        <div style={{ padding: '20px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e65100' }}>⚡ Cached Items</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#bf360c' }}>
            {stats?.cached_items || 0}
          </p>
        </div>
        
        <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>🖥️ Current Pod</h3>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0', color: '#1b5e20', wordBreak: 'break-all' }}>
            {lastPod || 'N/A'}
          </p>
          <p style={{ fontSize: '14px', margin: '5px 0 0 0', color: '#558b2f' }}>
            Source: {dataSource || 'N/A'}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={crashPod}
          style={{ 
            padding: '12px 24px', 
            background: '#d32f2f', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          💥 Crash Backend Pod (Test Self-Healing)
        </button>
        
        <button 
          onClick={clearCache}
          style={{ 
            padding: '12px 24px', 
            background: '#f57c00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🗑️ Clear Redis Cache
        </button>
        
        <button 
          onClick={fetchItems}
          style={{ 
            padding: '12px 24px', 
            background: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🔄 Refresh Items
        </button>
      </div>

      {/* Add Item Form */}
      <form onSubmit={addItem} style={{ 
        marginBottom: '30px', 
        padding: '25px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>➕ Add New Item</h3>
        <input
          type="text"
          placeholder="Item name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginBottom: '10px', 
            borderRadius: '5px', 
            border: 'none',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginBottom: '15px', 
            borderRadius: '5px', 
            border: 'none',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px 30px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Loading...' : 'Add Item'}
        </button>
      </form>

      {/* Items List */}
      <h3 style={{ marginBottom: '15px' }}>📝 Items List</h3>
      {loading ? (
        <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: '8px' }}>
          No items yet. Add your first item above!
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {items.map(item => (
            <div 
              key={item.id} 
              style={{ 
                padding: '20px', 
                background: 'white', 
                borderRadius: '10px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                border: '2px solid #e0e0e0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '18px' }}>
                    {item.name}
                  </h4>
                  <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
                    {item.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <small style={{ color: '#999', fontSize: '12px' }}>
                      🆔 ID: {item.id}
                    </small>
                    <small style={{ color: '#999', fontSize: '12px' }}>
                      📅 {new Date(item.created_at).toLocaleString()}
                    </small>
                  </div>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  style={{ 
                    padding: '10px 20px', 
                    background: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '8px', 
        textAlign: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ margin: '5px 0' }}>
          ⚡ Data cached for 30 seconds in Redis
        </p>
        <p style={{ margin: '5px 0' }}>
          🔄 Load balancing across 2 backend pods
        </p>
        <p style={{ margin: '5px 0' }}>
          🛡️ Self-healing: Pods auto-restart on crash
        </p>
      </div>
    </div>
  );
}

export default App;
