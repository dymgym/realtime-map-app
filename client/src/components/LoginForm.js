// client/src/components/LoginForm.js
import React, { useState } from 'react';
import axios from 'axios';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API = process.env.REACT_APP_API_URL;
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      onLogin(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Вход</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Пароль:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <button type="submit">Войти</button>
    </form>
  );
}