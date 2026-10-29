import React from 'react';
import { useOnlineStatus } from '../useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="pwa-offline-banner" role="status">
      <span className="pwa-offline-dot" />
      <span>Offline Mode — Playing from local Sanctum cache</span>
    </div>
  );
};
