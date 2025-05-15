// client/src/App.js
import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MapView from './components/MapView';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegistered = async (email, password) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const { token } = await res.json();
    localStorage.setItem('token', token);
    setToken(token);
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsRegistering(false);
  };

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        {isRegistering
          ? <RegisterForm onRegistered={handleRegistered} />
          : <LoginForm onLogin={handleLogin} />
        }
        <p style={{ marginTop: 20 }}>
          {isRegistering
            ? <>Уже есть аккаунт? <button onClick={() => setIsRegistering(false)}>Войти</button></>
            : <>Нет аккаунта? <button onClick={() => setIsRegistering(true)}>Зарегистрироваться</button></>
          }
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
      >
        Выйти
      </button>
      <MapView token={token} />
    </div>
  );
}

export default App;