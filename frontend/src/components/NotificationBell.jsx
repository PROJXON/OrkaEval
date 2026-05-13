import { useState, useEffect, useRef } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api';
import { useUser } from '../context/UserContext';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const { user } = useUser();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
                className="theme-toggle" 
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ position: 'relative', fontSize: '1.2rem', padding: '8px' }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{ 
                        position: 'absolute', 
                        top: '4px', 
                        right: '4px', 
                        background: 'var(--clr-error)', 
                        color: '#fff', 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        padding: '2px 6px', 
                        borderRadius: '10px',
                        border: '2px solid var(--clr-surface)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="card-glass anim-slide-up" style={{ 
                    position: 'absolute', 
                    top: '50px', 
                    right: '0', 
                    width: '320px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    zIndex: 1000,
                    padding: '0',
                    boxShadow: 'var(--shadow-card)'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                style={{ background: 'transparent', border: 'none', color: 'var(--clr-brand)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                                No notifications yet.
                            </p>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => handleMarkAsRead(n.id)}
                                    style={{ 
                                        padding: '16px', 
                                        borderBottom: '1px solid var(--clr-border)', 
                                        background: n.isRead ? 'transparent' : 'rgba(var(--clr-brand-rgb), 0.05)',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    className="notification-item"
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--clr-text)' }}>{n.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-subtle)', marginTop: '8px' }}>
                                        {new Date(n.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
