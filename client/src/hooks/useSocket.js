import { useContext, useEffect } from 'react';
import SocketContext from '../context/SocketContext';

/**
 * Access core WebSocket uplink state and dispatch tools.
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be invoked within an active <SocketProvider>');
  }
  return context;
};

/**
 * Tactical Hook: useOnAnnouncement
 * Subscribes to live announcements with automated listener cleanup
 * to prevent duplicate handlers and memory leaks.
 */
export const useOnAnnouncement = (handler) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || typeof handler !== 'function') return;

    socket.on('new_announcement', handler);

    return () => {
      socket.off('new_announcement', handler);
    };
  }, [socket, handler]);
};


/**
 * Tactical Hook: useOnAnnouncementDelete
 * Subscribes to remote notice deletion events with automated listener deregistration.
 */
export const useOnAnnouncementDelete = (handler) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || typeof handler !== 'function') return;

    socket.on('delete_announcement', handler);

    return () => {
      socket.off('delete_announcement', handler);
    };
  }, [socket, handler]);
};

export default useSocket;
