import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Plus, Trash2, UserPlus, X } from 'lucide-react';
import type { Database } from '../lib/supabase';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamMember = Database['public']['Tables']['team_members']['Row'];

interface TeamsProps {
  onClose: () => void;
}

export const Teams: React.FC<TeamsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading teams:', error);
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    const { error } = await supabase.from('teams').delete().eq('id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    } else {
      loadTeams();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Teams</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-lg text-cyan-300 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="flex justify-between items-center mb-6">
            <p className="text-cyan-300">Manage teams and share devices with other users</p>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg shadow-cyan-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-xl p-12 text-center">
              <Users className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
              <p className="text-cyan-300 mb-6">Create a team to share devices with others</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg shadow-cyan-500/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Create Team</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                        {team.created_by === user?.id && (
                          <span className="text-xs text-cyan-400">Owner</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedTeam(team)}
                        className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Manage</span>
                      </button>
                      {team.created_by === user?.id && (
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="p-2 bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 rounded-lg text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateTeam && (
        <CreateTeamModal
          onClose={() => setShowCreateTeam(false)}
          onSuccess={() => {
            setShowCreateTeam(false);
            loadTeams();
          }}
        />
      )}

      {selectedTeam && (
        <ManageTeamModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
};

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
      setLoading(false);
    } else {
      await supabase.from('team_members').insert({
        team_id: data.id,
        user_id: user.id,
        role: 'admin',
      });
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="backdrop-blur-xl bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/20">
        <h3 className="text-xl font-bold text-white mb-4">Create New Team</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="Engineering Team"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ManageTeamModalProps {
  team: Team;
  onClose: () => void;
}

const ManageTeamModal: React.FC<ManageTeamModalProps> = ({ team, onClose }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    if (error) {
      console.error('Error loading members:', error);
    } else {
      setMembers(data || []);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', newMemberEmail)
      .maybeSingle();

    if (userError || !userData) {
      alert('User not found');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userData.id,
      role: 'member',
    });

    if (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } else {
      setNewMemberEmail('');
      loadMembers();
    }
    setLoading(false);
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } else {
      loadMembers();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="backdrop-blur-xl bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/20">
        <h3 className="text-xl font-bold text-white mb-4">Manage Team: {team.name}</h3>

        {team.created_by === user?.id && (
          <form onSubmit={addMember} className="mb-6">
            <label className="block text-sm font-medium text-cyan-300 mb-2">Add Member</label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="member@email.com"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium rounded-lg shadow-lg shadow-cyan-500/30 transition-all disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        <div>
          <h4 className="text-sm font-medium text-cyan-300 mb-3">Members ({members.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-slate-800/30 border border-cyan-500/20 rounded-lg"
              >
                <div>
                  <p className="text-white text-sm">{member.user_id}</p>
                  <p className="text-cyan-400 text-xs capitalize">{member.role}</p>
                </div>
                {team.created_by === user?.id && member.user_id !== user.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 hover:bg-red-900/30 rounded-lg text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};
