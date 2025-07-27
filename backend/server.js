const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create directories and database
const SCRIPTS_DIR = './uploads/scripts';
const LOGS_DIR = './uploads/logs';

// Initialize SQLite database
const db = new sqlite3.Database('./scheduler.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    frequency_type TEXT NOT NULL,
    frequency_value INTEGER NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    is_active BOOLEAN DEFAULT 1,
    cron_expression TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (script_id) REFERENCES scripts (id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    stdout TEXT,
    stderr TEXT,
    exit_code INTEGER,
    FOREIGN KEY (schedule_id) REFERENCES schedules (id)
  )`);
});

// Create directories
async function initDirectories() {
  try {
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
    await fs.mkdir(LOGS_DIR, { recursive: true });
    console.log('Directories initialized');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// File upload configuration
const storage = multer.diskStorage({
  destination: SCRIPTS_DIR,
  filename: (req, file, cb) => {
    const scriptId = uuidv4();
    req.scriptId = scriptId;
    cb(null, `${scriptId}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.sh', '.bat'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .sh and .bat files are allowed'));
    }
  },
  limits: { fileSize: 1024 * 1024 } // 1MB limit
});

// Helper function to convert frequency to cron expression
function frequencyToCron(type, value) {
  switch (type) {
    case 'minutes':
      return `*/${value} * * * *`;
    case 'hours':
      return `0 */${value} * * *`;
    case 'days':
      return `0 0 */${value} * *`;
    default:
      throw new Error('Invalid frequency type');
  }
}

// Store for active cron jobs
const activeJobs = new Map();

// Function to execute script
async function executeScript(scheduleId, scriptPath, scriptType) {
  const executionId = uuidv4();
  const startTime = new Date().toISOString();
  
  // Insert execution record
  db.run(
    'INSERT INTO executions (id, schedule_id, status, started_at) VALUES (?, ?, ?, ?)',
    [executionId, scheduleId, 'running', startTime]
  );

  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = scriptType === 'bat' || isWindows ? 'cmd' : 'bash';
    const args = scriptType === 'bat' || isWindows ? ['/c', scriptPath] : [scriptPath];

    const child = spawn(command, args);
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const finishTime = new Date().toISOString();
      const status = code === 0 ? 'success' : 'failed';
      
      // Update execution record
      db.run(
        'UPDATE executions SET status = ?, finished_at = ?, stdout = ?, stderr = ?, exit_code = ? WHERE id = ?',
        [status, finishTime, stdout, stderr, code, executionId]
      );

      resolve({ executionId, status, code, stdout, stderr });
    });

    child.on('error', (error) => {
      const finishTime = new Date().toISOString();
      
      db.run(
        'UPDATE executions SET status = ?, finished_at = ?, stderr = ? WHERE id = ?',
        ['failed', finishTime, error.message, executionId]
      );

      resolve({ executionId, status: 'failed', error: error.message });
    });
  });
}

// API Routes

// Upload script
app.post('/api/scripts', upload.single('script'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const scriptId = req.scriptId;
  const { originalname, filename } = req.file;
  const type = path.extname(originalname).toLowerCase().slice(1);

  db.run(
    'INSERT INTO scripts (id, name, filename, type) VALUES (?, ?, ?, ?)',
    [scriptId, originalname, filename, type],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        id: scriptId,
        name: originalname,
        type,
        message: 'Script uploaded successfully'
      });
    }
  );
});

// Create schedule
app.post('/api/schedule', (req, res) => {
  const { scriptId, frequencyType, frequencyValue, startTime, endTime, runImmediately } = req.body;

  if (!scriptId || !frequencyType || !frequencyValue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const scheduleId = uuidv4();
  const cronExpression = frequencyToCron(frequencyType, frequencyValue);

  db.run(
    'INSERT INTO schedules (id, script_id, frequency_type, frequency_value, start_time, end_time, cron_expression) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [scheduleId, scriptId, frequencyType, frequencyValue, startTime, endTime, cronExpression],
    async function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get script details
      db.get('SELECT * FROM scripts WHERE id = ?', [scriptId], async (err, script) => {
        if (err || !script) {
          return res.status(404).json({ error: 'Script not found' });
        }

        const scriptPath = path.join(SCRIPTS_DIR, script.filename);

        // Schedule the cron job
        const job = cron.schedule(cronExpression, async () => {
          console.log(`Executing scheduled script: ${script.name}`);
          await executeScript(scheduleId, scriptPath, script.type);
        }, {
          scheduled: false
        });

        activeJobs.set(scheduleId, job);
        job.start();

        // Run immediately if requested
        if (runImmediately) {
          await executeScript(scheduleId, scriptPath, script.type);
        }

        res.json({
          id: scheduleId,
          scriptName: script.name,
          frequency: `${frequencyValue} ${frequencyType}`,
          cronExpression,
          message: 'Schedule created successfully'
        });
      });
    }
  );
});

// Get all schedules
app.get('/api/schedules', (req, res) => {
  const query = `
    SELECT s.*, sc.name as script_name, sc.type as script_type,
           e.status as last_status, e.finished_at as last_run
    FROM schedules s
    JOIN scripts sc ON s.script_id = sc.id
    LEFT JOIN executions e ON s.id = e.schedule_id
    WHERE s.is_active = 1
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const schedules = rows.map(row => ({
      id: row.id,
      scriptName: row.script_name,
      scriptType: row.script_type,
      frequency: `${row.frequency_value} ${row.frequency_type}`,
      cronExpression: row.cron_expression,
      lastStatus: row.last_status,
      lastRun: row.last_run,
      isActive: row.is_active === 1,
      createdAt: row.created_at
    }));

    res.json(schedules);
  });
});

// Get execution logs for a schedule
app.get('/api/schedules/:id/logs', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM executions WHERE schedule_id = ? ORDER BY started_at DESC LIMIT 10',
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(rows);
    }
  );
});

// Delete schedule
app.delete('/api/schedules/:id', (req, res) => {
  const { id } = req.params;

  // Stop cron job
  if (activeJobs.has(id)) {
    activeJobs.get(id).stop();
    activeJobs.delete(id);
  }

  // Mark as inactive in database
  db.run(
    'UPDATE schedules SET is_active = 0 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json({ message: 'Schedule deleted successfully' });
    }
  );
});

// Get all scripts
app.get('/api/scripts', (req, res) => {
  db.all('SELECT * FROM scripts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Load existing schedules on startup
function loadExistingSchedules() {
  db.all('SELECT * FROM schedules WHERE is_active = 1', [], (err, schedules) => {
    if (err) {
      console.error('Error loading existing schedules:', err);
      return;
    }

    schedules.forEach(schedule => {
      db.get('SELECT * FROM scripts WHERE id = ?', [schedule.script_id], (err, script) => {
        if (err || !script) return;

        const scriptPath = path.join(SCRIPTS_DIR, script.filename);
        const job = cron.schedule(schedule.cron_expression, async () => {
          console.log(`Executing scheduled script: ${script.name}`);
          await executeScript(schedule.id, scriptPath, script.type);
        });

        activeJobs.set(schedule.id, job);
        console.log(`Loaded schedule: ${script.name} - ${schedule.cron_expression}`);
      });
    });
  });
}

// Start server
async function startServer() {
  await initDirectories();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    loadExistingSchedules();
  });
}

startServer();