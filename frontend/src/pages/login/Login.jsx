import React, { useState } from 'react';
import './Login.scss';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), // Use email instead of username
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Login successful!');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        setMessage(`Login failed: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error during login. Please try again.');
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
            <input
              type="email" // Change type to "email"
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