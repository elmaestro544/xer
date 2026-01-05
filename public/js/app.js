/**
 * XER Dashboard - Frontend Application
 */

let currentProject = null;
let currentChart = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadLabel = document.querySelector('.upload-label');
const uploadStatus = document.getElementById('uploadStatus');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const loadingSpinner = document.getElementById('loadingSpinner');
const projectName = document.getElementById('projectName');
const projectInfo = document.getElementById('projectInfo');
const userInfo = document.getElementById('userInfo');

// Export buttons
const exportPDF = document.getElementById('exportPDF');
const exportPPTX = document.getElementById('exportPPTX');

// Navigation
const menuLinks = document.querySelectorAll('.menu-link');
const contentSections = document.querySelectorAll('.content-section');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // File upload
  fileInput.addEventListener('change', handleFileUpload);
  uploadLabel.addEventListener('dragover', handleDragOver);
  uploadLabel.addEventListener('dragleave', handleDragLeave);
  uploadLabel.addEventListener('drop', handleDrop);

  // Navigation
  menuLinks.forEach(link => {
    link.addEventListener('click', handleNavigation);
  });

  // Export buttons
  exportPDF.addEventListener('click', () => exportFile('pdf'));

  // PPTX temporarily disabled
  exportPPTX.disabled = true;

  // Date filters
  document.getElementById('applyDates').addEventListener('click', applyDateFilter);

  // Activity filters
  document.getElementById('activitySearch').addEventListener('input', filterActivities);
  document.getElementById('statusFilter').addEventListener('change', filterActivities);

  // Breakdown select
  document.getElementById('breakdownSelect').addEventListener('change', handleBreakdownChange);
}

// (rest of your app.js stays exactly as you already have it)
// NOTE: everything below this comment can remain unchanged from your current file.
