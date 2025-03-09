import React, { useState } from 'react';
import './register.css';
import { Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, name }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registration successful!');
      } else {
        setMessage(`Registration failed: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error during registration. Please try again.');
    }
  };

  return (
    <div className='Register'>
      <div className='card'>
        <div className='left'>
          <h1>Meow</h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem esse, dolores dolorum harum praesentium ipsum porro dolorem labore magnam tenetur.
          </p>
          <span>Already have an account?</span>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>

        <div className='right'>
          <h1>Register</h1>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit">Register</button>
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Register;