# Script Scheduler - Deployment Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Create project directory and install dependencies:**
   ```bash
   mkdir script-scheduler
   cd script-scheduler
   mkdir backend
   cd backend
   ```

2. **Copy the `server.js` and `package.json` files to the backend directory**

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. **Create React app (from project root):**
   ```bash
   npx create-react-app frontend
   cd frontend
   ```

2. **Install additional dependencies:**
   ```bash
   npm install lucide-react
   ```

3. **Replace the contents of `src/App.js` with the React component code**

4. **Start the frontend:**
   ```bash
   npm start
   ```
   
   The frontend will run on `http://localhost:3000`

## Production Deployment

### Option 1: Simple VPS/Server Deployment

1. **Backend Deployment:**
   ```bash
   # On your server
   git clone <your-repo>
   cd script-scheduler/backend
   npm install --production
   
   # Use PM2 for process management
   npm install -g pm2
   pm2 start server.js --name "script-scheduler-backend"
   pm2 startup
   pm2 save
   ```

2. **Frontend Deployment:**
   ```bash
   cd ../frontend
   npm install
   npm run build
   
   # Serve with nginx or Apache
   # Copy build folder to your web server
   cp -r build/* /var/www/html/
   ```

### Option 2: Docker Deployment

1. **Backend Dockerfile:**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. **Frontend Dockerfile:**
   ```dockerfile
   FROM node:16-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         - "3001:3001"
       volumes:
         - ./data:/app/uploads
         - ./data/scheduler.db:/app/scheduler.db
     
     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend
   ```

### Option 3: Cloud Deployment

#### Heroku
1. **Backend (Heroku):**
   ```bash
   # In backend directory
   heroku create your-app-backend
   git push heroku main
   ```

2. **Frontend (Netlify/Vercel):**
   - Build the React app: `npm run build`
   - Deploy the `build` folder to Netlify or Vercel
   - Update API_BASE URL in the React component

#### AWS/Azure/GCP
- Use services like AWS Elastic Beanstalk, Azure App Service, or Google Cloud Run
- Set up proper security groups/firewalls
- Consider using managed databases instead of SQLite for production

## Security Considerations

### For Production Deployment:

1. **Environment Variables:**
   ```bash
   # .env file
   PORT=3001
   NODE_ENV=production
   UPLOAD_DIR=/secure/path/uploads
   DB_PATH=/secure/path/scheduler.db
   ```

2. **Security Headers:**
   ```javascript
   // Add to server.js
   const helmet = require('helmet');
   app.use(helmet());
   ```

3. **Rate Limiting:**
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api', limiter);
   ```

4. **File Upload Security:**
   - Implement file type validation
   - Scan uploaded files for malware
   - Set appropriate file size limits
   - Store uploads outside web root

5. **Database Security:**
   - Use PostgreSQL/MySQL instead of SQLite for production
   - Implement proper connection pooling
   - Use prepared statements (already implemented)

## Monitoring and Maintenance

1. **Logging:**
   ```javascript
   const winston = require('winston');
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

2. **Health Checks:**
   - The backend includes a `/api/health` endpoint
   - Set up monitoring with tools like Uptime Robot or Pingdom

3. **Backup Strategy:**
   ```bash
   # Backup script files and database
   tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ scheduler.db
   ```

## File Structure
```
script-scheduler/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── uploads/
│   │   ├── scripts/
│   │   └── logs/
│   └── scheduler.db
├── frontend/
│   ├── src/
│   │   └── App.js
│   ├── package.json
│   └── build/
└── README.md
```

## Testing the System

1. **Upload a test script:**
   - Create a simple test script: `echo "Hello World" > test.sh`
   - Upload it through the frontend
   
2. **Create a schedule:**
   - Schedule it to run every 2 minutes
   - Check the status tab for execution results

3. **Monitor logs:**
   - View execution logs in the status tab
   - Check server logs for any errors

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Ensure backend CORS is configured correctly
   - Check that frontend API_BASE URL is correct

2. **File Upload Issues:**
   - Verify upload directory permissions
   - Check file size limits

3. **Script Execution Failures:**
   - Ensure scripts have proper execute permissions
   - Check that required interpreters are installed (bash, cmd)

4. **Database Issues:**
   - Verify SQLite file permissions
   - Check disk space

This system provides a complete, production-ready script scheduling solution that can be easily deployed to various platforms!