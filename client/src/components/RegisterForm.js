// client/src/components/RegisterForm.js
import React, { useState } from 'react';
import axios from 'axios';

export default function RegisterForm({ onRegistered }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const API = process.env.REACT_APP_API_URL;
      await axios.post(`${API}/auth/register`, { email, password });
      onRegistered(email, password); // после регистрации можно сразу логинить
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Регистрация</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Пароль:</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}