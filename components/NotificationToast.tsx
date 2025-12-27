import React from 'react';

interface Notification {
    id: number;
    message: string;
}

interface NotificationToastProps {
  notifications: Notification[];
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications }) => {
  return (
    <div className="fixed top-20 right-4 z-[150] space-y-2">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className="bg-primary text-primary-fg p-3 rounded-lg shadow-2xl flex items-center space-x-3 max-w-sm border border-border animate-slide-in-right"
          style={{ animationFillMode: 'forwards', animationDuration: '0.5s' }}
        >
          <span className="font-bold">🎉</span>
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      ))}
    </div>
  );
};

// Add keyframes to index.html or a global CSS file
const keyframes = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation-name: slide-in-right;
}
`;

// A simple way to inject styles, for a real app use a CSS file.
const styleSheet = document.createElement("style");
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);
