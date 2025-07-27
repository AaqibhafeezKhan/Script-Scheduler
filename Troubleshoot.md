# Complete Troubleshooting Guide

## Your Code is Ready - Just Run It!

**No changes needed** - your GitHub repo code will work locally as-is.

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd Script-Scheduler/backend
npm install
npm start

# Terminal 2 - Frontend
cd Script-Scheduler/frontend
npm install
npm start
```

Frontend opens at: http://localhost:3000

---

## Common Issues & Solutions

### 1. **"npm install" Fails**

**Symptoms:**
- Permission errors
- Package not found errors
- Network timeouts

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install

# If permission issues (Mac/Linux)
sudo npm install -g npm

# If corporate firewall
npm config set registry https://registry.npmjs.org/
npm config set strict-ssl false
```

### 2. **Port Already in Use (EADDRINUSE)**

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions:**
```bash
# Find and kill the process
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Or use different ports
# In backend/server.js, change:
const PORT = process.env.PORT || 3002; // Use 3002 instead

# In frontend/src/App.js, update:
const API_BASE = 'http://localhost:3002/api';
```

### 3. **"Cannot find module" Errors**

**Missing backend dependencies:**
```bash
cd backend
npm install express multer cors node-cron sqlite3 uuid
```

**Missing frontend dependencies:**
```bash
cd frontend
npm install react react-dom react-scripts lucide-react
```

### 4. **CORS Errors in Browser**

**Error:** `Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked`

**Already fixed in your code, but if issues persist:**
```javascript
// In backend/server.js, make sure this exists:
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

### 5. **SQLite Database Issues**

**Symptoms:**
- "Database is locked" errors
- "No such table" errors

**Solutions:**
```bash
# Delete database file (will be recreated)
cd backend
rm scheduler.db

# Restart backend
npm start
```

### 6. **File Upload Not Working**

**Symptoms:**
- Upload button doesn't respond
- "No file uploaded" errors

**Check:**
```bash
# Make sure uploads directory exists and has permissions
cd backend
mkdir -p uploads/scripts uploads/logs
chmod 755 uploads uploads/scripts uploads/logs
```

### 7. **Scripts Won't Execute**

**Windows (.bat files):**
- Make sure Windows Defender isn't blocking execution
- Check if uploaded .bat files are in `backend/uploads/scripts/`

**Mac/Linux (.sh files):**
```bash
# Give execute permission to uploaded scripts
chmod +x backend/uploads/scripts/*.sh

# Make sure bash is available
which bash
```

### 8. **Frontend Won't Load**

**Symptoms:**
- White/blank page
- "Module not found" in browser console

**Solutions:**
```bash
# Clear React cache
cd frontend
rm -rf node_modules/.cache
npm start

# If still issues, rebuild
rm -rf node_modules package-lock.json
npm install
npm start
```

### 9. **API Calls Failing**

**Check in browser Developer Tools (F12) → Network tab:**

**If API calls to localhost:3001 fail:**
```javascript
// In frontend/src/App.js, try:
const API_BASE = 'http://127.0.0.1:3001/api';
// instead of
const API_BASE = 'http://localhost:3001/api';
```

### 10. **Node.js Version Issues**

**Error:** `Unsupported engine` or syntax errors

**Check version:**
```bash
node --version
npm --version
```

**Required:** Node.js v16+

**Update if needed:**
- Download from nodejs.org
- Or use nvm: `nvm install 18 && nvm use 18`

---

## Emergency Reset (Nuclear Option)

If everything breaks:

```bash
# Kill all Node processes
# Windows:
taskkill /f /im node.exe

# Mac/Linux:
killall node

# Clean everything
cd Script-Scheduler
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/scheduler.db backend/uploads

# Reinstall everything
cd backend
npm install
cd ../frontend
npm install

# Start fresh
cd ../backend && npm start
# In new terminal:
cd ../frontend && npm start
```

---

## Testing Your Setup

### 1. Backend Test
Visit: http://localhost:3001/api/health
Should show: `{"status":"OK","timestamp":"..."}`

### 2. Frontend Test
Visit: http://localhost:3000
Should see the Script Scheduler interface

### 3. End-to-End Test
1. Create simple test script:
   ```bash
   echo "Hello World" > test.sh
   # or create test.bat with: echo Hello World
   ```
2. Upload through interface
3. Schedule to run every 2 minutes
4. Check status tab for results

---

## Debug Mode

**Enable detailed logging:**

Backend (add to server.js):
```javascript
// Add at the top
console.log('Server starting...');

// Add before each route
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

Frontend (open Browser F12 → Console for React errors)

---

## Performance Checks

**If app is slow:**
1. Check CPU usage (Task Manager/Activity Monitor)
2. Stop other Node processes
3. Increase system memory if possible
4. Check if antivirus is scanning uploads folder

---

## Corporate Network Issues

**If behind corporate firewall:**
```bash
# Set npm registry
npm config set registry https://registry.npmjs.org/
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Skip SSL verification (not recommended for production)
npm config set strict-ssl false
```

---

## Success Indicators

✅ Backend starts with: "Server running on port 3001"
✅ Frontend opens browser automatically to localhost:3000
✅ No errors in terminal
✅ Can upload and schedule scripts
✅ Scripts execute and show logs

Your code is production-ready - these troubleshooting steps handle 99% of local setup issues!
