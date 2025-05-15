// client/src/components/MapView.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import useWebSocket from '../hooks/useWebSocket';
import 'leaflet/dist/leaflet.css';

export default function MapView({ token }) {
  const { messages, send } = useWebSocket(token);
  const [myPosition, setMyPosition] = useState(null);
  const [friends, setFriends] = useState({});

  // Геолокация: отправляем свою позицию
  useEffect(() => {
    const watcher = navigator.geolocation.watchPosition(
      pos => {
        const data = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          ts: Math.floor(pos.timestamp / 1000),
        };
        setMyPosition(data);
        send({ type: 'location', ...data });
      },
      err => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [send]);

  // Обработка WS-сообщений от друзей
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.type === 'friendLocation') {
        setFriends(prev => ({
          ...prev,
          [msg.uiId]: {
            lat: msg.lat,
            lon: msg.lon,
            ts: msg.ts,
            customText: msg.customText,
            email: prev[msg.uiId]?.email
          }
        }));
      }
    });
  }, [messages]);

  if (!myPosition) return <p>Получаем вашу геопозицию…</p>;

  const friendsList = Object.entries(friends).map(([uiId, data]) => ({ uiId, ...data }));

  return (
    <MapContainer
      center={[myPosition.lat, myPosition.lon]}
      zoom={13}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Ваш маркер */}
      <Marker position={[myPosition.lat, myPosition.lon]}>
        <Popup>Вы</Popup>
      </Marker>

      {/* Маркеры друзей с произвольным текстом */}
      {friendsList.map(friend => (
        <Marker
          key={friend.uiId}
          position={[friend.lat, friend.lon]}
        >
          <Popup>
            {friend.customText || friend.email}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
