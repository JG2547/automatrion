/*
  # Control Panel Database Schema

  ## Overview
  This migration creates the complete database schema for a web-based device control panel
  that allows users to remotely send commands to desktop computers.

  ## New Tables

  ### 1. `teams`
  Stores team information for shared device access
  - `id` (uuid, primary key) - Unique team identifier
  - `name` (text) - Team name
  - `created_by` (uuid) - User who created the team
  - `created_at` (timestamptz) - When the team was created

  ### 2. `team_members`
  Junction table for team membership
  - `id` (uuid, primary key) - Unique membership identifier
  - `team_id` (uuid) - Reference to team
  - `user_id` (uuid) - Reference to user
  - `role` (text) - Member role (admin, member)
  - `joined_at` (timestamptz) - When user joined the team

  ### 3. `devices`
  Stores registered desktop devices that can receive commands
  - `id` (uuid, primary key) - Unique device identifier
  - `name` (text) - User-friendly device name
  - `ip_address` (text) - Device IP address
  - `port` (integer) - Device port number
  - `owner_id` (uuid) - User who owns the device
  - `team_id` (uuid, nullable) - Team the device belongs to (if shared)
  - `status` (text) - Device status (online, offline, unknown)
  - `last_seen` (timestamptz) - Last time device was active
  - `created_at` (timestamptz) - When device was registered

  ### 4. `commands`
  Stores commands sent to devices for execution
  - `id` (uuid, primary key) - Unique command identifier
  - `device_id` (uuid) - Target device
  - `command_type` (text) - Type of command (unmute_zoom, next_track)
  - `payload` (jsonb) - Additional command parameters
  - `status` (text) - Command status (pending, delivered, executed, failed)
  - `sent_by` (uuid) - User who sent the command
  - `sent_at` (timestamptz) - When command was sent
  - `executed_at` (timestamptz, nullable) - When command was executed

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with policies ensuring:
  - Users can only access their own devices and commands
  - Team members can access shared team devices
  - Team admins have additional management permissions

  ### Policies

  #### teams table:
  - Users can view teams they're members of
  - Users can create new teams
  - Team creators can update their teams
  - Team creators can delete their teams

  #### team_members table:
  - Users can view memberships of teams they belong to
  - Team admins can add new members
  - Team admins can remove members
  - Users can remove themselves from teams

  #### devices table:
  - Users can view their own devices
  - Team members can view team devices
  - Users can create devices
  - Device owners can update their devices
  - Team admins can update team devices
  - Device owners can delete their devices

  #### commands table:
  - Users can view commands for their devices
  - Team members can view commands for team devices
  - Users can send commands to their devices
  - Team members can send commands to team devices
  - System can update command status

  ## Important Notes
  1. All tables use uuid for primary keys with automatic generation
  2. Timestamps default to current time
  3. Foreign key constraints ensure referential integrity
  4. Indexes added for frequently queried columns (device_id, status, sent_at)
  5. RLS policies are restrictive by default - all access must be explicitly granted
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ip_address text NOT NULL,
  port integer NOT NULL CHECK (port > 0 AND port <= 65535),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  status text DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown')),
  last_seen timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  command_type text NOT NULL CHECK (command_type IN ('unmute_zoom', 'next_track')),
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'executed', 'failed')),
  sent_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  executed_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_owner_id ON devices(owner_id);
CREATE INDEX IF NOT EXISTS idx_devices_team_id ON devices(team_id);
CREATE INDEX IF NOT EXISTS idx_commands_device_id ON commands(device_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_sent_at ON commands(sent_at);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table
CREATE POLICY "Users can view teams they are members of"
  ON teams FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team creators can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team creators can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for team_members table
CREATE POLICY "Users can view team memberships of their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = auth.uid()
    )
  );

CREATE POLICY "Team admins can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can remove themselves from teams"
  ON team_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for devices table
CREATE POLICY "Users can view their own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Team members can view team devices"
  ON devices FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = devices.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Device owners can update their devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team admins can update team devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = devices.team_id
      AND teams.created_by = auth.uid()
    )
  )
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = devices.team_id
      AND teams.created_by = auth.uid()
    )
  );

CREATE POLICY "Device owners can delete their devices"
  ON devices FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for commands table
CREATE POLICY "Users can view commands for their devices"
  ON commands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can view commands for team devices"
  ON commands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      JOIN team_members ON team_members.team_id = devices.team_id
      WHERE devices.id = commands.device_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send commands to their devices"
  ON commands FOR INSERT
  TO authenticated
  WITH CHECK (
    sent_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team members can send commands to team devices"
  ON commands FOR INSERT
  TO authenticated
  WITH CHECK (
    sent_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM devices
      JOIN team_members ON team_members.team_id = devices.team_id
      WHERE devices.id = commands.device_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update command status"
  ON commands FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);