import { useEffect, useCallback, useState } from 'react';
import { connectSocket, getSocket } from './socketClient';

export default function useSocket(eventName?: string, callback?: (...args: unknown[]) => void) {
  const [connected, setConnected] = useState(getSocket()?.connected ?? false);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (eventName && callback) {
      socket.on(eventName, callback);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      if (eventName && callback) {
        socket.off(eventName, callback);
      }
    };
  }, [eventName, callback]);

  const subscribe = useCallback((ev, cb) => {
    const socket = connectSocket();
    socket.on(ev, cb);
    return () => socket.off(ev, cb);
  }, []);

  const unsubscribe = useCallback((ev, cb) => {
    const socket = connectSocket();
    socket.off(ev, cb);
  }, []);

  return { isConnected: connected, subscribe, unsubscribe };
}
