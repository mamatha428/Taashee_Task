import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/login', { username, password }, { withCredentials: true });
      alert(response.data);
      // ✅ Redirect based on username
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
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required /><br />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
