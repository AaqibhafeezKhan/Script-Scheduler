# Running Script Scheduler Locally

## Prerequisites

- **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org)
- **Git** (to clone your repo)

## Quick Setup (5 minutes)

### Step 1: Clone and Setup Backend

```bash
# Clone your repository
git clone https://github.com/AaqibhafeezKhan/Script-Scheduler.git
cd Script-Scheduler

# Navigate to backend
cd backend

# Install dependencies
npm install

# Start the backend server
npm start
```

The backend will run on `http://localhost:3001`

### Step 2: Setup Frontend (New Terminal)

```bash
# Open a new terminal window/tab
# Navigate to your project root
cd Script-Scheduler

# Go to frontend directory
cd frontend

# Install dependencies
npm install

# Install the icon library
npm install lucide-react

# Start the frontend
npm start
```

The frontend will automatically open at `http://localhost:3000`

## That's It! 🎉

Your script scheduler is now running locally:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Database**: SQLite file created automatically in `backend/scheduler.db`

## Testing the System

1. **Upload a test script:**
   - Create a simple test file: `echo "Hello World!"` (save as `test.sh` or `test.bat`)
   - Upload it through the web interface

2. **Schedule it:**
   - Set it to run every 2 minutes
   - Check "run immediately" if you want

3. **View results:**
   - Go to the "View Status" tab
   - You'll see execution logs and status

## File Structure After Setup

```
Script-Scheduler/
├── backend/
│   ├── server.js              # Backend server
│   ├── package.json           # Backend dependencies
│   ├── scheduler.db           # SQLite database (auto-created)
│   ├── uploads/               # Auto-created
│   │   ├── scripts/          # Uploaded scripts stored here
│   │   └── logs/             # Execution logs
│   └── node_modules/         # Dependencies
└── frontend/
    ├── src/
    │   └── App.js            # React frontend
    ├── package.json          # Frontend dependencies
    ├── node_modules/         # Dependencies
    └── build/                # Built files (after npm run build)
```

## Stopping the Services

- **Frontend**: Press `Ctrl+C` in the frontend terminal
- **Backend**: Press `Ctrl+C` in the backend terminal

## Restarting Later

Whenever you want to use it again:

```bash
# Terminal 1 - Backend
cd Script-Scheduler/backend
npm start

# Terminal 2 - Frontend  
cd Script-Scheduler/frontend
npm start
```

## Accessing from Other Devices (Optional)

If you want to access it from other devices on your network:

### Backend (server.js) - Add this line:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Frontend - Update API_BASE:
```javascript
// Replace 'localhost' with your computer's IP address
const API_BASE = 'http://192.168.1.100:3001/api'; // Your actual IP
```

Then access from other devices using: `http://your-ip:3000`

## Troubleshooting

### Port Already in Use:
```bash
# Kill processes using the ports
npx kill-port 3000 3001
```

### Missing Dependencies:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Script Won't Execute:
- **Windows**: Make sure `.bat` files are in the uploads folder
- **Mac/Linux**: Scripts need execute permission:
  ```bash
  chmod +x uploads/scripts/*.sh
  ```

### Database Issues:
- Delete `scheduler.db` file - it will be recreated automatically

## Development Mode

For development with auto-reload:

```bash
# Backend with auto-restart
cd backend
npm install -g nodemon  # Install globally (one time)
nodemon server.js

# Frontend already has hot-reload built-in
cd frontend
npm start
```

## Production Build (Optional)

To create an optimized build:

```bash
cd frontend
npm run build
# Creates optimized files in 'build' folder
```

## Security Note

When running locally:
- Only accessible from your computer by default
- Scripts execute with your user permissions
- Be careful with scripts from untrusted sources

## Performance

- **SQLite database** stores all data locally
- **File uploads** stored in `backend/uploads/scripts/`
- **Execution logs** stored in database
- No external dependencies once running

Your local setup will be **faster and more reliable** than most cloud deployments since everything runs on your machine!
