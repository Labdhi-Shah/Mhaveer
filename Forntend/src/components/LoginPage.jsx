import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://mhaveer.onrender.com/api/auth/login', {
        email: email,
        password: password,
      });
      console.log('Login successful', response.data);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div>
      <input 
        type="email" 
        placeholder="Email ID" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <br />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <br />
      <button type="button" onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;
