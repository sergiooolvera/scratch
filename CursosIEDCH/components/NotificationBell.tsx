'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Notification {
    id: string
    usuario_id: string
    actor_id: string | null
    tipo: string
    mensaje: string
    enlace: string | null
    leida: boolean
    created_at: string
}

export default function NotificationBell({ userId }: { userId: string }) {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!userId) return

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('ie_notificaciones')
                .select('*')
                .eq('usuario_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.leida).length)
            }
        }

        fetchNotifications()

        // Suscribirse a cambios en tiempo real
        const channel = supabase.channel('notificaciones-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ie_notificaciones',
                    filter: `usuario_id=eq.${userId}`
                },
                (payload) => {
                    fetchNotifications() // Recargar para mantener el orden correcto
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        
        await supabase
            .from('ie_notificaciones')
            .update({ leida: true })
            .eq('id', id)
    }

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.leida).map(n => n.id)
        if (unreadIds.length === 0) return

        setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
        setUnreadCount(0)

        await supabase
            .from('ie_notificaciones')
            .update({ leida: true })
            .in('id', unreadIds)
    }

    const deleteAllNotifications = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar todas tus notificaciones?')) return
        
        setNotifications([])
        setUnreadCount(0)

        await supabase
            .from('ie_notificaciones')
            .delete()
            .eq('usuario_id', userId)
    }

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        e.preventDefault()
        
        setNotifications(prev => prev.filter(n => n.id !== id))
        
        // Update unread count if we deleted an unread notification
        const notif = notifications.find(n => n.id === id)
        if (notif && !notif.leida) {
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

        await supabase
            .from('ie_notificaciones')
            .delete()
            .eq('id', id)
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours} h`
        if (diffDays === 1) return `Ayer`
        return date.toLocaleDateString()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Notificaciones"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
                        <div className="flex space-x-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                    title="Marcar todas como leídas"
                                >
                                    <Check className="h-3 w-3 mr-1" /> Leídas
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button 
                                    onClick={deleteAllNotifications}
                                    className="text-xs text-red-500 hover:text-red-700 flex items-center"
                                    title="Eliminar todas"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No tienes notificaciones nuevas
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className={`group relative p-3 hover:bg-gray-50 transition-colors ${!notif.leida ? 'bg-blue-50/30' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            {notif.enlace ? (
                                                <Link 
                                                    href={notif.enlace} 
                                                    onClick={() => {
                                                        if (!notif.leida) markAsRead(notif.id)
                                                        setIsOpen(false)
                                                    }}
                                                    className="flex-1 pr-6"
                                                >
                                                    <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        {notif.mensaje}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                                                </Link>
                                            ) : (
                                                <div 
                                                    onClick={() => !notif.leida && markAsRead(notif.id)}
                                                    className="flex-1 cursor-pointer pr-6"
                                                >
                                                    <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        {notif.mensaje}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={(e) => deleteNotification(e, notif.id)}
                                                className="absolute top-3 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                                title="Eliminar"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
