import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Documents from './pages/Documents';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/admin-documents" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
