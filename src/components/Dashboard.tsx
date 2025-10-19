import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, Monitor, Wifi, WifiOff, Mic, Music, Users, Trash2, Edit2, Settings } from 'lucide-react';
import type { Database } from '../lib/supabase';
import { Teams } from './Teams';

type Device = Database['public']['Tables']['devices']['Row'] & {
  team?: { name: string } | null;
};
type Command = Database['public']['Tables']['commands']['Row'];

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showTeams, setShowTeams] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    subscribeToCommands();
  }, []);

  const loadDevices = async () => {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        team:teams(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading devices:', error);
    } else {
      setDevices(data || []);
    }
    setLoading(false);
  };

  const subscribeToCommands = () => {
    const channel = supabase
      .channel('commands_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commands',
        },
        () => {
          loadDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendCommand = async (deviceId: string, commandType: 'unmute_zoom' | 'next_track') => {
    if (!user) return;

    const { error } = await supabase.from('commands').insert({
      device_id: deviceId,
      command_type: commandType,
      sent_by: user.id,
      status: 'pending',
    });

    if (error) {
      console.error('Error sending command:', error);
      alert('Failed to send command');
    } else {
      alert('Command sent successfully!');
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    const { error } = await supabase.from('devices').delete().eq('id', deviceId);

    if (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device');
    } else {
      loadDevices();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'offline':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)]"></div>

      <div className="relative z-10">
        <nav className="backdrop-blur-xl bg-slate-900/50 border-b border-cyan-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Device Control Center</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-cyan-300">{user?.email}</span>
                <button
                  onClick={() => setShowTeams(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Teams</span>
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Devices</h2>
              <p className="text-cyan-300">Manage and control your connected devices</p>
            </div>
            <button
              onClick={() => setShowAddDevice(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Device</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : devices.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-12 text-center">
              <Monitor className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No devices yet</h3>
              <p className="text-cyan-300 mb-6">Add your first device to get started</p>
              <button
                onClick={() => setShowAddDevice(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add Device</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{device.name}</h3>
                        {device.team && (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-md text-xs text-cyan-400">
                            <Users className="w-3 h-3" />
                            <span>{device.team.name}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-cyan-300/70">
                        {device.ip_address}:{device.port}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg border ${getStatusColor(device.status)}`}>
                      {getStatusIcon(device.status)}
                      <span className="text-xs font-medium capitalize">{device.status}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <button
                      onClick={() => sendCommand(device.id, 'unmute_zoom')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800/50 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Unmute Zoom Audio</span>
                    </button>
                    <button
                      onClick={() => sendCommand(device.id, 'next_track')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800/50 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-cyan-300 hover:text-cyan-200 transition-all"
                    >
                      <Music className="w-4 h-4" />
                      <span>Next AIMP Track</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t border-cyan-500/10">
                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800/30 hover:bg-slate-800/50 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-cyan-400 text-sm transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 text-sm transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showAddDevice && (
        <AddDeviceModal
          onClose={() => setShowAddDevice(false)}
          onSuccess={() => {
            setShowAddDevice(false);
            loadDevices();
          }}
        />
      )}

      {selectedDevice && (
        <EditDeviceModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onSuccess={() => {
            setSelectedDevice(null);
            loadDevices();
          }}
        />
      )}

      {showTeams && <Teams onClose={() => setShowTeams(false)} />}
    </div>
  );
};

interface AddDeviceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('devices').insert({
      name,
      ip_address: ipAddress,
      port: parseInt(port),
      owner_id: user.id,
    });

    if (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-cyan-500/20">
        <h2 className="text-2xl font-bold text-white mb-6">Add New Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Device Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="My Computer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">IP Address</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="192.168.1.100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="8080"
              min="1"
              max="65535"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditDeviceModalProps {
  device: Device;
  onClose: () => void;
  onSuccess: () => void;
}

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({ device, onClose, onSuccess }) => {
  const [name, setName] = useState(device.name);
  const [ipAddress, setIpAddress] = useState(device.ip_address);
  const [port, setPort] = useState(device.port.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('devices')
      .update({
        name,
        ip_address: ipAddress,
        port: parseInt(port),
      })
      .eq('id', device.id);

    if (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-cyan-500/20">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Device Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">IP Address</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              min="1"
              max="65535"
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
