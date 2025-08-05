import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ userRole, setUserRole }) => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Customer Onboarding System</h1>
          </div>
          
          <nav className="nav">
            <Link 
              to="/onboarding" 
              className={`nav-link ${location.pathname === '/onboarding' ? 'active' : ''}`}
            >
              Customer Onboarding
            </Link>
            <Link 
              to="/open-tasks" 
              className={`nav-link ${location.pathname === '/open-tasks' ? 'active' : ''}`}
            >
              Open Task
            </Link>
          </nav>
          
          {/* <div className="user-controls">
            {userRole === 'admin' && (
              <button 
                className="clear-data-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all application data? This cannot be undone.')) {
                    localStorage.removeItem('submittedApplications');
                    window.dispatchEvent(new Event('storage'));
                    alert('All application data cleared successfully!');
                  }
                }}
                title="Clear all application data"
              >
                🗑️ Clear Data
              </button>
            )}
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
              className="role-selector"
            >
              <option value="customer">Customer View</option>
              <option value="admin">Admin View</option>
            </select>
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;