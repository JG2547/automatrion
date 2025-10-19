/**
 * Zoom Control Configuration
 * Prime and VIP Zoom Meeting Settings
 */

export const ZOOM_CONFIG = {
  PRIME: {
    name: 'Prime',
    description: 'Prime Zoom Meeting Room',
    defaultIP: import.meta.env.VITE_PRIME_IP || '',
    defaultPort: parseInt(import.meta.env.VITE_PRIME_PORT || '3000'),
    deviceId: import.meta.env.VITE_PRIME_DEVICE_ID || '',
  },
  VIP: {
    name: 'VIP',
    description: 'VIP Zoom Meeting Room',
    defaultIP: import.meta.env.VITE_VIP_IP || '',
    defaultPort: parseInt(import.meta.env.VITE_VIP_PORT || '3000'),
    deviceId: import.meta.env.VITE_VIP_DEVICE_ID || '',
  },
};

export const COMMANDS = {
  UNMUTE_ZOOM: 'unmute_zoom',
  NEXT_TRACK: 'next_track',
} as const;

export const COMMAND_LABELS = {
  [COMMANDS.UNMUTE_ZOOM]: 'Unmute Zoom',
  [COMMANDS.NEXT_TRACK]: 'Next Track',
};

export const STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
} as const;

export const STATUS_LABELS = {
  [STATUS.ONLINE]: 'Online',
  [STATUS.OFFLINE]: 'Offline',
  [STATUS.UNKNOWN]: 'Unknown',
};

export const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL_MS || '5000');
