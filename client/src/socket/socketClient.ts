import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '../config/api'
import { useAuthStore } from '../stores/authStore'

let socket: Socket | null = null

export function getSocket(): Socket | null { return socket }

export function connectSocket(): Socket {
  if (socket?.connected) return socket
  const token = useAuthStore.getState().token
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null }
}

export function joinBusiness(businessId: string) {
  socket?.emit('join:business', businessId)
}
