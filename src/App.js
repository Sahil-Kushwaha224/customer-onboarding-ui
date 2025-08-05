import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header/Header';
import CustomerOnboarding from './components/CustomerOnboarding/CustomerOnboarding';
import OpenTask from './components/OpenTask/OpenTask';

function App() {
  const [userRole, setUserRole] = useState('customer'); // 'customer' or 'admin'

  return (
    <Router>
      <div className="App">
        <Header userRole={userRole} setUserRole={setUserRole} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/onboarding" replace />} />
            <Route path="/onboarding" element={<CustomerOnboarding />} />
            <Route path="/open-tasks" element={<OpenTask />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;