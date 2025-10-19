# 🎯 Zoom Control - Integration Guide

**Remote Control Dashboard for Prime & VIP Zoom Meetings**

---

## 🎯 Purpose

Control two Zoom meeting rooms remotely:
- **Prime** - Primary DJ/music session Zoom room
- **VIP** - VIP DJ/music session Zoom room

**Key Actions**:
- 🔊 Unmute hosts remotely
- 🎵 Control music playback (next track)
- 📊 Monitor room status (online/offline)
- 👥 Team-based access control

---

## 🏗️ Architecture

```
zoom-control/
├── Frontend (React + Supabase)
│   └── Web dashboard for remote control
│
├── Backend (Supabase)
│   ├── PostgreSQL database
│   ├── Row-Level Security
│   └── Real-time subscriptions
│
└── Desktop Clients (Node.js)
    ├── Prime room client
    └── VIP room client
```

**Flow**:
1. User clicks "Unmute Zoom" on Prime device in web dashboard
2. Command inserted into Supabase `commands` table
3. Desktop client (running on Prime computer) polls Supabase
4. Client finds pending command and executes Zoom API call
5. Client updates command status to "executed"
6. Dashboard shows success in real-time

---

## 📦 What's Included

### ✅ Web Dashboard
- Device management (add Prime/VIP devices)
- Command interface (unmute, next track buttons)
- Team management (share access with others)
- Status monitoring (online/offline indicators)
- Command history (audit trail)

### ✅ Database Schema
- `devices` - Prime and VIP Zoom endpoints
- `commands` - Command queue with status tracking
- `teams` - Shared access management
- `team_members` - Role-based permissions

### ✅ Authentication
- Supabase Auth (email/password)
- Row-Level Security (RLS)
- Team-based access control

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/zoom-control
npm install
```

### 2. Configure Supabase

Create `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run Migrations

The migration file is already in `supabase/migrations/`.

```bash
# If using Supabase CLI
supabase db push

# Or manually run:
# supabase/migrations/20251019000741_create_control_panel_schema.sql
```

### 4. Start Development

```bash
npm run dev
```

Access at: http://localhost:5173

### 5. Register Devices

In the dashboard:

1. Sign up / Log in
2. Click "Add Device"
3. Enter Prime device:
   - Name: **Prime**
   - IP: `192.168.1.100` (or your Prime computer IP)
   - Port: `3000` (or your API port)
4. Enter VIP device:
   - Name: **VIP**
   - IP: `192.168.1.101` (or your VIP computer IP)
   - Port: `3000`

---

## 🖥️ Desktop Client Setup

You need a desktop client running on each computer (Prime & VIP) that:
- Polls Supabase for pending commands
- Executes Zoom API calls
- Updates command status

### Example Client (Node.js)

Create `desktop-client/index.js`:

```javascript
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_KEY = 'your_service_role_key'; // Use service role, not anon key
const DEVICE_ID = 'your_device_uuid'; // Get from dashboard after adding device

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Poll for commands every 5 seconds
setInterval(pollCommands, 5000);

async function pollCommands() {
  try {
    // Get pending commands for this device
    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('device_id', DEVICE_ID)
      .eq('status', 'pending')
      .order('sent_at', { ascending: true });

    if (error) throw error;

    for (const command of commands || []) {
      await executeCommand(command);
    }

    // Update device status
    await supabase
      .from('devices')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', DEVICE_ID);

  } catch (error) {
    console.error('Poll error:', error);
  }
}

async function executeCommand(command) {
  try {
    console.log(`Executing command: ${command.command_type}`);

    // Mark as delivered
    await supabase
      .from('commands')
      .update({ status: 'delivered' })
      .eq('id', command.id);

    // Execute based on command type
    if (command.command_type === 'unmute_zoom') {
      // Call Zoom API to unmute
      await zoomUnmute();
    } else if (command.command_type === 'next_track') {
      // Control music player
      await musicPlayerNext();
    }

    // Mark as executed
    await supabase
      .from('commands')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString()
      })
      .eq('id', command.id);

    console.log(`✅ Command executed: ${command.id}`);

  } catch (error) {
    console.error(`❌ Command failed: ${command.id}`, error);

    // Mark as failed
    await supabase
      .from('commands')
      .update({ status: 'failed' })
      .eq('id', command.id);
  }
}

async function zoomUnmute() {
  // Implement Zoom API call to unmute
  // This depends on how your Zoom integration works
  console.log('Unmuting Zoom host...');

  // Example:
  // await axios.post('http://localhost:3000/zoom/unmute');
}

async function musicPlayerNext() {
  // Implement music player control
  console.log('Skipping to next track...');

  // Example:
  // await axios.post('http://localhost:3000/music/next');
}

console.log(`🚀 Desktop client started for device: ${DEVICE_ID}`);
```

Run the client:

```bash
node index.js
```

---

## 🔗 Integration with Mini App

Add Zoom Control to your Mini App admin panel:

### 1. Add Route in Mini App

In `apps/mini-app/src/index.js`:

```javascript
app.get('/admin/zoom-control', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/zoom-control.html'));
});
```

### 2. Create Admin Page

`apps/mini-app/public/admin/zoom-control.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Zoom Control - Botify Network</title>
</head>
<body>
    <iframe
        src="http://localhost:5173"
        width="100%"
        height="100%"
        frameborder="0"
    ></iframe>
</body>
</html>
```

### 3. Add to Navigation

Update admin navbar to include:

```html
<a href="/admin/zoom-control">Zoom Control</a>
```

---

## 📊 Using the Dashboard

### Send Commands

1. **Unmute Prime Zoom**:
   - Find Prime device in dashboard
   - Click "Unmute Zoom" button
   - Command queued → Desktop client executes → Status updates

2. **Next Track on VIP**:
   - Find VIP device
   - Click "Next Track"
   - Music player skips to next song

### Team Collaboration

1. **Create Team**:
   - Click "Teams" tab
   - Click "Create Team"
   - Name: "DJ Team"

2. **Add Members**:
   - Click team
   - Add member emails
   - They receive access to team devices

3. **Assign Devices**:
   - Edit Prime device
   - Set Team: "DJ Team"
   - All team members can now control Prime

### Monitor Status

- **Green Wifi Icon**: Device online (seen < 1 min ago)
- **Red Wifi Icon**: Device offline (seen > 1 min ago)
- **Gray Icon**: Unknown status

---

## 🔐 Security

- ✅ **RLS Policies**: Users can only access their own devices or team devices
- ✅ **Authentication**: Supabase Auth required
- ✅ **Team Permissions**: Admin vs Member roles
- ✅ **Audit Trail**: All commands logged with user + timestamp

---

## 🐛 Troubleshooting

### Device Shows Offline

**Problem**: Desktop client not running or not updating status

**Fix**:
1. Start desktop client on that computer
2. Check `DEVICE_ID` matches device in dashboard
3. Verify Supabase connection

### Commands Stay in "Pending"

**Problem**: Desktop client not polling

**Fix**:
1. Check desktop client is running
2. Verify polling interval (should be ~5 seconds)
3. Check Supabase credentials

### Can't Send Commands

**Problem**: Permission denied

**Fix**:
1. Verify you own the device OR are a team member
2. Check device is assigned to your team
3. Verify RLS policies in Supabase

---

## 🎨 Customization

### Add New Command Types

1. Update `commands` table constraint:

```sql
ALTER TABLE commands DROP CONSTRAINT commands_command_type_check;
ALTER TABLE commands ADD CONSTRAINT commands_command_type_check
  CHECK (command_type IN ('unmute_zoom', 'next_track', 'your_new_command'));
```

2. Add button in Dashboard.tsx:

```tsx
<button onClick={() => sendCommand(device.id, 'your_new_command')}>
  Your New Action
</button>
```

3. Handle in desktop client:

```javascript
else if (command.command_type === 'your_new_command') {
  await yourNewFunction();
}
```

---

## 📈 Future Features

- [ ] Video control (camera on/off)
- [ ] Screen share control
- [ ] Recording start/stop
- [ ] Participant management
- [ ] Scheduled commands
- [ ] Webhooks for notifications
- [ ] Mobile app

---

## 🚀 Deployment

### Frontend (React App)

**Option 1: Vercel**

```bash
npm run build
vercel --prod
```

**Option 2: Railway**

```bash
railway init
railway up
```

### Desktop Clients

Run as services on Prime/VIP computers:

**Windows (PM2)**:

```bash
npm install -g pm2
pm2 start index.js --name prime-client
pm2 startup
pm2 save
```

**Linux (systemd)**:

```bash
sudo systemctl enable prime-client.service
sudo systemctl start prime-client
```

---

## 📝 Summary

✅ **Web Dashboard**: React + Supabase for remote control
✅ **Prime & VIP**: Two separate Zoom meeting endpoints
✅ **Commands**: Unmute Zoom, Next Track (extendable)
✅ **Real-time**: Instant status updates via Supabase
✅ **Team Access**: Share control with team members
✅ **Secure**: RLS + Auth + Audit logging

**Next Steps**:
1. Set up Supabase project
2. Run migrations
3. Deploy frontend
4. Install desktop clients on Prime/VIP computers
5. Test commands!

---

**Made with ❤️ for Botify Network**
