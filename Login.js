import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '');

  // Clear the message after 3 seconds
  useEffect(() => {
    if (bannerMessage) {
      const timer = setTimeout(() => setBannerMessage(''), 3000);
      return () => clearTimeout(timer); // cleanup
    }
  }, [bannerMessage]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8081/login', { username, password }, { withCredentials: true });

      if (username === 'admin') {
        navigate('/admin-documents');
      } else {
        navigate('/documents');
      }
    } catch (error) {
      alert('Login failed: ' + (error.response?.data || error.message));
    }
  };

  return (
    <div>
      {bannerMessage && <div className="info-banner">{bannerMessage}</div>}
      <div className="login-container">
        <img
          src="https://mms.businesswire.com/media/20200728005285/en/808374/23/Alfresco_PrimaryLogo_HEX_LargeScale.jpg"
          alt="Alfresco Logo"
          className="login-logo"
        />
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          /><br />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
