import { useEffect } from 'react';

export default function useGeolocation(onLocation) {
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }
    const watcher = navigator.geolocation.watchPosition(
      pos => {
        onLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          ts: Math.floor(pos.timestamp / 1000)
        });
      },
      err => console.error('Geo error', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [onLocation]);
}