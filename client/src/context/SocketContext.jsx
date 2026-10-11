import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/**
 * Tactical WebSocket Context: SocketProvider
 * Manages authenticated duplex WebSocket uplink for real-time announcements,
 * system broadcast telemetries, and HUD connectivity metrics.
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('OFFLINE'); // 'ONLINE' | 'CONNECTING' | 'OFFLINE' | 'SIGNAL_LOST'
  const [latency, setLatency] = useState(null);
  const [incomingNotice, setIncomingNotice] = useState(null);

  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const clearIncomingNotice = useCallback(() => {
    setIncomingNotice(null);
  }, []);

  useEffect(() => {
    // -------------------------------------------------------------------------
    // TEARDOWN UPLINK IF UNICAST SESSION IS INACTIVE
    // -------------------------------------------------------------------------
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        console.log('[WSS] Cadet unauthenticated. Severing socket connection.');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('OFFLINE');
      setLatency(null);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    // -------------------------------------------------------------------------
    // ESTABLISH AUTHENTICATED WSS UPLINK
    // -------------------------------------------------------------------------
    setConnectionStatus('CONNECTING');

    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
      : 'http://localhost:5000';

    console.log(`[WSS_INITIATING] Targeting tactical endpoint: ${backendUrl}`);

    const socketInstance = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // -------------------------------------------------------------------------
    // EVENT LISTENERS & LIFECYCLE GUARDS
    // -------------------------------------------------------------------------
    socketInstance.on('connect', () => {
      console.log(`[WSS_ESTABLISHED] Connected to server telemetry. Socket ID: ${socketInstance.id}`);
      setIsConnected(true);
      setConnectionStatus('ONLINE');

      // Immediate initial telemetry latency ping
      const startPing = Date.now();
      socketInstance.emit('ping_telemetry', startPing, (res) => {
        if (res && res.rtt !== null) {
          setLatency(res.rtt);
        } else {
          setLatency(Date.now() - startPing);
        }
      });
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn(`[WSS_DISCONNECTED] Socket disconnected: ${reason}`);
      setIsConnected(false);
      if (reason === 'io client disconnect') {
        setConnectionStatus('OFFLINE');
      } else {
        setConnectionStatus('SIGNAL_LOST');
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error(`[WSS_CONNECT_ERROR] Transmission fault:`, error.message);
      setIsConnected(false);
      setConnectionStatus('SIGNAL_LOST');
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      console.log(`[WSS_RECONNECT_ATTEMPT] Handshake retry #${attempt}...`);
      setConnectionStatus('CONNECTING');
    });

    socketInstance.on('reconnect', () => {
      console.log('[WSS_RECONNECTED] Uplink restored.');
      setIsConnected(true);
      setConnectionStatus('ONLINE');
    });

    // Universal broadcast listener for immediate live notice
    socketInstance.on('new_announcement', (announcement) => {
      console.log(`[WSS_INBOUND_NOTICE] Priority: ${announcement.priority} | Title: '${announcement.title}'`);
      setIncomingNotice(announcement);
    });

    // Remote notice purge listener
    socketInstance.on('delete_announcement', ({ id }) => {
      console.log(`[WSS_DELETE_NOTICE] Purging deleted notice: ${id}`);
      setIncomingNotice((prev) => (prev?._id === id ? null : prev));
    });

    // Periodic telemetry ping (every 30 seconds)
    pingIntervalRef.current = setInterval(() => {
      if (socketInstance.connected) {
        const start = Date.now();
        socketInstance.emit('ping_telemetry', start, (res) => {
          if (res && res.rtt !== null) {
            setLatency(res.rtt);
          } else {
            setLatency(Date.now() - start);
          }
        });
      }
    }, 30000);

    // -------------------------------------------------------------------------
    // CLEANUP & DEREGISTRATION ON UNMOUNT / AUTH CHANGE
    // -------------------------------------------------------------------------
    return () => {
      console.log('[WSS_TEARDOWN] Purging active socket listeners and closing stream.');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.off('reconnect_attempt');
      socketInstance.off('reconnect');
      socketInstance.off('new_announcement');
      socketInstance.off('delete_announcement');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    latency,
    incomingNotice,
    clearIncomingNotice,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be consumed within an active <SocketProvider>');
  }
  return context;
};

export default SocketContext;
