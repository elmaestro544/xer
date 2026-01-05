require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const XERParser = require('./parsers/xer-parser');
const {
  calculateEarnedValue,
  calculateKPIs
} = require('./utils/calculations');
const { generatePDF } = require('./utils/pdf-generator');
// PPTX export disabled for now – no require here
const { generateProjectSummary } = require('./utils/gemini-client');

const app = express();
const PORT = process.env.PORT || 80;  // CHANGED from 3000 to 80
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(__dirname, 'temp');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/octet-stream' ||
    path.extname(file.originalname).toLowerCase() === '.xer'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only XER files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 52_428_800 } // 50MB
});

// Init dirs
async function initializeDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log('✓ Directories initialized');
  } catch (error) {
    console.error('Failed to create directories:', error);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res
    .status(200)
    .json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Upload + parse XER
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const parser = new XERParser(fileContent);
    const projectData = parser.parse();

    if (!projectData) {
      return res.status(400).json({ error: 'Failed to parse XER file' });
    }

    const kpis = calculateKPIs(projectData);
    const earnedValue = calculateEarnedValue(projectData);

    // Store last project in memory (single-user)
    global.lastProjectData = projectData;
    global.lastProjectKPIs = kpis;
    global.lastProjectEV = earnedValue;

    res.status(200).json({
      success: true,
      projectId: projectData.project_id || `proj_${Date.now()}`,
      project: {
        name: projectData.project_name || 'Unnamed Project',
        id: projectData.project_id,
        startDate: projectData.project_start_date,
        endDate: projectData.project_end_date,
        status: projectData.project_status,
        activities: projectData.activities || []
      },
      kpis,
      earnedValue,
      activityCount: projectData.activities?.length || 0,
      resourceCount: projectData.resources?.length || 0,
      resources: projectData.resources || []
    });

    // cleanup
    setTimeout(() => {
      fs.unlink(filePath).catch(err =>
        console.error('Failed to delete temp file:', err)
      );
    }, 5000);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'File processing failed' });
  }
});

// Get current project
app.get('/api/project/:id', (req, res) => {
  try {
    if (!global.lastProjectData) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = global.lastProjectData;
    const kpis = global.lastProjectKPIs || calculateKPIs(projectData);
    const earnedValue = global.lastProjectEV || calculateEarnedValue(projectData);

    res.status(200).json({
      project: {
        name: projectData.project_name,
        id: projectData.project_id,
        startDate: projectData.project_start_date,
        endDate: projectData.project_end_date,
        status: projectData.project_status
      },
      kpis,
      earnedValue,
      activities: projectData.activities || [],
      resources: projectData.resources || [],
      timeline: projectData.timeline || {}
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export PDF (with Gemini summary)
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { projectData, dateRange } = req.body;

    if (!projectData && !global.lastProjectData) {
      return res.status(400).json({ error: 'No project data provided' });
    }

    const data = projectData || global.lastProjectData;
    const kpis = global.lastProjectKPIs || calculateKPIs(data);

    let executiveSummary = '';
    try {
      executiveSummary = await generateProjectSummary(data, kpis);
    } catch (aiError) {
      console.error('Gemini summary error (PDF):', aiError.message);
      executiveSummary = '';
    }

    const pdfPath = await generatePDF(
      { ...data, executiveSummary, kpis },
      dateRange,
      TEMP_DIR
    );

    res.download(
      pdfPath,
      `${data.project_name || 'report'}.pdf`,
      err => {
        if (err) console.error('Download error:', err);
        fs.unlink(pdfPath).catch(e => console.error('Cleanup error:', e));
      }
    );
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: error.message || 'PDF generation failed' });
  }
});

// PPTX export disabled – keep route stub so frontend can be updated later
app.post('/api/export/pptx', (req, res) => {
  return res
    .status(503)
    .json({ error: 'PPTX export is temporarily disabled on this server.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File size exceeds limit' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }

  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function start() {
  try {
    await initializeDirectories();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   XER Dashboard Running                ║
║   http://localhost:${PORT}                 ║
║   Node: ${process.version}           ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

start();

module.exports = app;
