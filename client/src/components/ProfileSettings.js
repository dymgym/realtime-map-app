// client/src/components/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileSettings({ token }) {
  const API = process.env.REACT_APP_API_URL;
  const [iconUrl, setIconUrl] = useState('');
  const [customText, setCustomText] = useState('');

  // Загрузка текущих настроек
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIconUrl(res.data.iconUrl);
        setCustomText(res.data.customText);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [API, token]);

  // Сохранение изменений
  const handleSave = async () => {
    try {
      await axios.patch(
        `${API}/users/me`,
        { iconUrl, customText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Сохранено!');
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Мои настройки на карте</h3>
      <div style={{ marginBottom: 10 }}>
        <label>URL иконки:&nbsp;</label>
        <input
          type="text"
          value={iconUrl}
          onChange={e => setIconUrl(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Текст на карте:&nbsp;</label>
        <input
          type="text"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      <button onClick={handleSave}>Сохранить</button>
    </div>
  );
}