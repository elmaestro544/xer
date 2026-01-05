# XER Dashboard Analysis Tool - Setup Guide

## Project Overview
A full-stack Node.js application that:
1. **Accepts .XER file uploads** from Primavera P6
2. **Parses and analyzes** project data
3. **Displays interactive dashboard** with KPIs and charts
4. **Exports to PowerPoint** (static slides) and **PDF** (detailed report)
5. **Runs in Docker** ready for Coolify deployment

## Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + Chart.js + Bootstrap
- **XER Parsing**: Custom regex-based parser + xer-parser npm library
- **PDF Generation**: PDFKit + Chart generation
- **PowerPoint Generation**: pptxgen-js
- **Docker**: Multi-stage build for production optimization

## Key Features
✅ XER file upload and validation
✅ Real-time dashboard with:
  - Look Ahead KPIs (PV, EV, SPI, CPI)
  - Activity list with schedule data
  - Earned Value Analysis charts
  - Resource allocation visualization
✅ PDF Report export with charts, tables, metrics
✅ PowerPoint slides export (static format)
✅ Date range filtering
✅ Project health indicators
✅ Dark theme UI (like EasyDash)

## Files Provided
1. `Dockerfile` - Production-ready container
2. `docker-compose.yml` - Local development setup
3. `server.js` - Express backend with XER parser
4. `package.json` - Dependencies
5. `public/index.html` - Frontend dashboard
6. `public/css/style.css` - Styling
7. `public/js/app.js` - Dashboard logic
8. `.env.example` - Environment variables

## Quick Start
```bash
# With Docker
docker build -t xer-dashboard .
docker run -p 3000:3000 xer-dashboard

# With Docker Compose (development)
docker-compose up

# Direct Node.js
npm install
npm start
```

## API Endpoints
- `POST /api/upload` - Upload XER file
- `GET /api/project/:id` - Get project analysis
- `POST /api/export/pdf` - Export PDF report
- `POST /api/export/pptx` - Export PowerPoint slides
- `GET /api/health` - Health check

## Environment Variables
```
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=50MB
TEMP_DIR=/tmp/xer-files
```

## Project Structure
```
xer-dashboard/
├── server.js
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── parsers/
│   └── xer-parser.js
├── utils/
│   ├── calculations.js
│   ├── pdf-generator.js
│   └── pptx-generator.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── uploads/ (created at runtime)
```

## Database Alternative (Optional)
For production with persistent storage, integrate:
- Supabase PostgreSQL (as you use it)
- MongoDB Atlas
- InfluxDB (for time-series project data)

## Next Steps
1. Generate sample XER file from P6 for testing
2. Deploy to Coolify with Docker image
3. Configure nginx reverse proxy (optional)
4. Set up persistent volume for uploaded files
5. Implement authentication (JWT recommended)
