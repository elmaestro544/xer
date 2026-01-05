# XER Dashboard - Complete Application

A professional-grade **Primavera P6 XER File Analysis Dashboard** with PDF/PowerPoint export capabilities, built for deployment on Coolify.

## 🎯 Features

### Core Functionality
✅ **XER File Upload & Parsing** - Accept Primavera P6 .XER files up to 50MB  
✅ **Real-time Dashboard** - Interactive analysis with Earned Value charts  
✅ **KPI Analysis** - SPI, CPI, Schedule/Cost Variance, Estimates at Completion  
✅ **Activity Tracking** - Full activity list with schedule and cost metrics  
✅ **Resource Management** - Resource allocation and utilization tracking  
✅ **Date Filtering** - Analyze project data by date range  
✅ **PDF Export** - Detailed reports with charts, tables, and metrics  
✅ **PowerPoint Export** - Static slide presentations (5 slides)  
✅ **Dark Theme UI** - Professional design matching EasyDash style  

### Technical Features
✅ **Docker Ready** - Multi-stage build for production optimization  
✅ **Coolify Compatible** - Ready for deployment on Coolify  
✅ **Scalable Architecture** - Clean separation of concerns  
✅ **Error Handling** - Comprehensive error management and validation  
✅ **Security** - Helmet.js, CORS, file validation  
✅ **Responsive Design** - Works on desktop and mobile  

## 📁 Project Structure

```
xer-dashboard/
├── server.js                 # Express backend
├── package.json             # Dependencies
├── Dockerfile               # Production Docker image
├── docker-compose.yml       # Local development setup
├── .env.example             # Environment variables template
├── README.md                # This file
│
├── parsers/
│   └── xer-parser.js       # XER file parser logic
│
├── utils/
│   ├── calculations.js     # KPI and EV calculations
│   ├── pdf-generator.js    # PDF report generation
│   └── pptx-generator.js   # PowerPoint slide generation
│
├── public/
│   ├── index.html          # Frontend HTML
│   ├── js/
│   │   └── app.js          # Frontend JavaScript
│   └── css/
│       └── style.css       # Stylesheet
│
└── uploads/                 # XER file uploads (auto-created)
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Build image
docker build -t xer-dashboard .

# Run container
docker run -p 3000:3000 xer-dashboard

# With volumes for persistent data
docker run -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/temp:/app/temp \
  xer-dashboard
```

### Option 2: Docker Compose (Development)

```bash
docker-compose up
```

Starts on `http://localhost:3000`

### Option 3: Node.js Direct

```bash
npm install
npm start
```

## 🔧 API Endpoints

### File Operations
- `POST /api/upload` - Upload and parse XER file
- `GET /api/project/:id` - Get parsed project analysis
- `GET /api/health` - Health check endpoint

### Export Operations
- `POST /api/export/pdf` - Generate PDF report
- `POST /api/export/pptx` - Generate PowerPoint presentation

## 📊 Dashboard Sections

### 1. Overview
- KPI cards: PV, EV, Completion %, SPI
- Earned Value Analysis chart
- Project health indicator

### 2. KPIs
- Schedule metrics (SPI, SV)
- Cost metrics (CPI, CV)
- Projection metrics (EAC, VAC)
- Health status

### 3. Activities
- Full activity list with search/filter
- Schedule details (start, finish dates)
- Cost data (BAC, EV, AC)
- Progress tracking

### 4. Resources
- Resource allocation cards
- Resource rates and types
- Max units tracking

## 📄 Export Formats

### PDF Report
- Executive summary with KPIs
- Activities detail table (20 activities max)
- Performance metrics
- Health status
- Professional formatting

### PowerPoint Slides
- Title slide
- Executive summary (KPI cards)
- Activities summary table
- Activities detail list (12 activities)
- Project status conclusion

## 🔑 Environment Variables

Create `.env` file from `.env.example`:

```bash
PORT=3000                      # Server port
NODE_ENV=production           # Environment
MAX_FILE_SIZE=50MB            # Max upload size
TEMP_DIR=/tmp/xer-files       # Temp file directory
UPLOAD_DIR=/app/uploads       # Upload directory
```

## 🐳 Coolify Deployment

### Prerequisites
- Coolify instance running
- Docker registry access (optional)

### Steps

1. **Clone repository to your server**
   ```bash
   git clone <repo-url>
   cd xer-dashboard
   ```

2. **Create Coolify application**
   - Go to Coolify dashboard
   - New application → Docker
   - Set repository source (or upload files)

3. **Configure build**
   - Dockerfile path: `./Dockerfile`
   - Build pack: Docker

4. **Set environment**
   - Add variables from `.env.example`
   - Ensure `NODE_ENV=production`

5. **Configure persistence** (important!)
   - Add volume: `/app/uploads` → persistent storage
   - Add volume: `/app/temp` → temporary storage

6. **Deploy**
   - Click Deploy
   - Wait for build completion
   - Access at your domain

### Coolify Docker Compose Alternative

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  xer-dashboard:
    image: xer-dashboard:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - uploads:/app/uploads
      - temp:/app/temp
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  uploads:
  temp:
```

## 📦 Dependencies

### Main
- **Express.js** 4.18.2 - Web framework
- **Multer** 1.4.5 - File upload handling
- **PDFKit** 0.13.0 - PDF generation
- **pptxgen-js** 3.12.0 - PowerPoint generation
- **Chart.js** 4.4.0 - Chart visualization
- **xer-parser** 2.1.0 - XER file parsing

### Security & Middleware
- **Helmet.js** 7.1.0 - HTTP headers security
- **CORS** 2.8.5 - Cross-origin requests
- **Morgan** 1.10.0 - HTTP logging

### Development
- **Node.js** ≥ 18.0.0
- **npm** 9+

## 🔍 XER File Format

The parser extracts:
- **Project metadata** (name, ID, dates, status)
- **Activities** (tasks with schedules, costs, progress)
- **Resources** (labor, material, rates)
- **Task-Resource assignments**
- **Calculated metrics** (PV, EV, AC)

### Supported Tables
- PROJNODE - Project information
- TASK - Activities/Tasks
- RSRC - Resources
- TASKRSRC - Task-resource assignments

## 📈 Calculations

### Earned Value Metrics
- **PV (Planned Value)** = Sum of budgeted work
- **EV (Earned Value)** = Sum of completed work value
- **AC (Actual Cost)** = Sum of actual spending

### Performance Indices
- **SPI** = EV / PV (Schedule performance)
- **CPI** = EV / AC (Cost performance)
- **SV** = EV - PV (Schedule variance)
- **CV** = EV - AC (Cost variance)

### Projections
- **EAC** = AC / CPI (Estimate at completion)
- **VAC** = PV - EV (Variance at completion)

## 🛠️ Customization

### Adding New Calculations
Edit `utils/calculations.js`:
```javascript
function calculateCustomMetric(activities) {
  // Your calculation logic
  return result;
}
```

### Styling Dashboard
Modify `public/css/style.css`:
- CSS variables at top for colors
- Responsive breakpoints at bottom
- Grid/flex layouts throughout

### Extending Exports
Modify export generators:
- PDF: `utils/pdf-generator.js`
- PPTX: `utils/pptx-generator.js`

## 🐛 Troubleshooting

### Upload Fails
- Check file size (max 50MB)
- Verify file format (.XER)
- Check `UPLOAD_DIR` permissions

### Charts Don't Display
- Verify Chart.js CDN is accessible
- Check browser console for errors
- Ensure data is populated

### PDF/PPTX Empty
- Verify project data exists
- Check temp directory permissions
- Review console logs

### Docker Build Fails
- Ensure Node 20+ installed
- Check Docker daemon running
- Review build log for errors

## 📝 Notes for Production

### Security
- [ ] Enable JWT authentication
- [ ] Implement rate limiting
- [ ] Add HTTPS/SSL
- [ ] Validate all inputs
- [ ] Use environment variables for secrets

### Performance
- [ ] Enable caching headers
- [ ] Compress responses (gzip)
- [ ] Implement database for project storage
- [ ] Add Redis for session management
- [ ] Optimize file upload handling

### Monitoring
- [ ] Set up error logging (Sentry)
- [ ] Monitor disk usage
- [ ] Track API response times
- [ ] Alert on health check failures

### Database Integration (Optional)
For production, consider integrating:
- **Supabase PostgreSQL** - Store parsed projects
- **MongoDB** - Document-based storage
- **InfluxDB** - Time-series metrics

## 🤝 Integration with Your Stack

### n8n Workflows
Create automation workflows to:
1. Monitor folder for new XER files
2. Trigger analysis via API
3. Generate and send reports
4. Archive results

### Coolify Deployment
1. Use Coolify's Docker integration
2. Configure health checks
3. Set up auto-scaling if needed
4. Enable persistent volumes

### Supabase Integration (Optional)
Store projects in PostgreSQL:
```javascript
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY);
// Store parsed projects
await supabase.from('projects').insert([projectData]);
```

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

For issues or questions:
1. Check troubleshooting section
2. Review console logs
3. Verify Docker/environment setup
4. Check file format compatibility

---

**Built for:** Construction Project Management  
**Deploy to:** Coolify  
**Stack:** Node.js + Express + Docker  
**Last Updated:** December 2025
