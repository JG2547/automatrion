import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          name: string;
          ip_address: string;
          port: number;
          owner_id: string;
          team_id: string | null;
          status: 'online' | 'offline' | 'unknown';
          last_seen: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ip_address: string;
          port: number;
          owner_id: string;
          team_id?: string | null;
          status?: 'online' | 'offline' | 'unknown';
          last_seen?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          ip_address?: string;
          port?: number;
          owner_id?: string;
          team_id?: string | null;
          status?: 'online' | 'offline' | 'unknown';
          last_seen?: string | null;
          created_at?: string;
        };
      };
      commands: {
        Row: {
          id: string;
          device_id: string;
          command_type: 'unmute_zoom' | 'next_track';
          payload: Record<string, unknown>;
          status: 'pending' | 'delivered' | 'executed' | 'failed';
          sent_by: string;
          sent_at: string;
          executed_at: string | null;
        };
        Insert: {
          id?: string;
          device_id: string;
          command_type: 'unmute_zoom' | 'next_track';
          payload?: Record<string, unknown>;
          status?: 'pending' | 'delivered' | 'executed' | 'failed';
          sent_by: string;
          sent_at?: string;
          executed_at?: string | null;
        };
        Update: {
          id?: string;
          device_id?: string;
          command_type?: 'unmute_zoom' | 'next_track';
          payload?: Record<string, unknown>;
          status?: 'pending' | 'delivered' | 'executed' | 'failed';
          sent_by?: string;
          sent_at?: string;
          executed_at?: string | null;
        };
      };
    };
  };
}
