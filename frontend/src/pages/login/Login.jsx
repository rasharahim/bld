import React, { useState } from 'react';
import './Login.scss';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('user'); // 'user' or 'admin'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    console.log("Login attempt with:", { 
      email, 
      password, 
      userType
    });
  
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      console.log("Raw response:", response);
  
      const data = await response.json();
      console.log("Response data:", data);
  
      if (!response.ok) {
        setMessage(data.error || 'Login failed');
        return;
      }
  
      localStorage.setItem("token", data.token);
      console.log("Stored Token:", localStorage.getItem("token")); // ✅ Check if the token is stored
  
      setMessage('Login successful!');
      setTimeout(() => {
        navigate(data.user.role === 'admin' ? '/admin-dashboard' : '/home');
      }, 1000);
  
    } catch (error) {
      console.error("Full login error:", error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className='Login'>
      <div className='card'>
        <div className='left'>
          <h1>Hello World</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem esse, dolores dolorum harum praesentium ipsum porro dolorem labore magnam tenetur.
          </p>
          <span>Don't have an account?</span>
          <Link to="/register">
            <button>Register</button>
          </Link>
        </div>

        <div className='right'>
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="user-type-select"
            >
              <option value="user">User Login</option>
              <option value="admin">Admin Login</option>
            </select>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          <Link to="/forgot-password" className="forgot-password">
            Forgot Password?
          </Link>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
