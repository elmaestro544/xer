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
  exportPPTX.addEventListener('click', () => exportFile('pptx'));

  // Date filters
  document.getElementById('applyDates').addEventListener('click', applyDateFilter);

  // Activity filters
  document.getElementById('activitySearch').addEventListener('input', filterActivities);
  document.getElementById('statusFilter').addEventListener('change', filterActivities);

  // Breakdown select
  document.getElementById('breakdownSelect').addEventListener('change', handleBreakdownChange);
}

// File Upload Handlers
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    uploadFile(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  uploadLabel.style.borderColor = 'var(--color-accent)';
  uploadLabel.style.backgroundColor = 'rgba(56, 189, 248, 0.05)';
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadLabel.style.borderColor = 'var(--color-primary)';
  uploadLabel.style.backgroundColor = 'transparent';
}

function handleDrop(e) {
  e.preventDefault();
  uploadLabel.style.borderColor = 'var(--color-primary)';
  uploadLabel.style.backgroundColor = 'transparent';

  const files = e.dataTransfer.files;
  if (files[0]) {
    uploadFile(files[0]);
  }
}

async function uploadFile(file) {
  if (!file.name.endsWith('.xer')) {
    showStatus('Only .XER files are allowed', 'error');
    return;
  }

  if (file.size > 52428800) { // 50MB
    showStatus('File size exceeds 50MB limit', 'error');
    return;
  }

  showLoading(true);
  uploadStatus.textContent = 'Uploading...';

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    if (data.success) {
      currentProject = {
        ...data.project,
        kpis: data.kpis,
        earnedValue: data.earnedValue
      };

      updateDashboard(data);
      showStatus('File processed successfully', 'success');

      // Enable export buttons
      exportPDF.disabled = false;
      exportPPTX.disabled = false;

      // Switch to overview
      switchSection('overview');
    } else {
      showStatus('Failed to process file', 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showStatus('Upload failed: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Dashboard Update
function updateDashboard(data) {
  const { project, kpis } = data;

  // Update header
  projectName.textContent = project.name;
  projectInfo.textContent = `Project ID: ${project.id} | Start: ${project.startDate} | End: ${project.endDate}`;
  userInfo.textContent = `Loaded: ${project.name}`;

  // Update KPI cards
  document.getElementById('kvPV').textContent = `$${kpis.totalPlannedValue.toLocaleString()}`;
  document.getElementById('kvEV').textContent = `$${kpis.totalEarnedValue.toLocaleString()}`;
  document.getElementById('kvPercent').textContent = `${kpis.percentComplete.toFixed(1)}%`;
  document.getElementById('kvSPI').textContent = kpis.schedulePerformanceIndex.toFixed(3);

  // Update KPI detail cards
  document.getElementById('detailSPI').textContent = kpis.schedulePerformanceIndex.toFixed(3);
  document.getElementById('detailSV').textContent = `$${kpis.scheduleVariance.toLocaleString()}`;
  document.getElementById('detailCPI').textContent = kpis.costPerformanceIndex.toFixed(3);
  document.getElementById('detailCV').textContent = `$${kpis.costVariance.toLocaleString()}`;
  document.getElementById('detailEAC').textContent = `$${kpis.estimateAtCompletion.toLocaleString()}`;
  document.getElementById('detailVAC').textContent = `$${kpis.varianceAtCompletion.toLocaleString()}`;

  // Update health status
  const healthBadge = document.getElementById('healthStatus');
  healthBadge.textContent = kpis.health;
  healthBadge.className = 'health-badge ' + kpis.health.toLowerCase().replace(' ', '-');
  document.getElementById('healthDescription').textContent = `Project is ${kpis.health}`;

  // Update activities table
  updateActivitiesTable(data);

  // Update resources
  updateResources(data);

  // Create chart
  createEVChart(data.earnedValue);
}

function updateActivitiesTable(data) {
  const tbody = document.getElementById('activitiesBody');
  tbody.innerHTML = '';

  if (!data.project || !data.project.activities || data.project.activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">No activities available</td></tr>';
    return;
  }

  data.project.activities.forEach(activity => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${activity.id || 'N/A'}</td>
      <td>${activity.name || 'N/A'}</td>
      <td>${activity.startDate || 'N/A'}</td>
      <td>${activity.endDate || 'N/A'}</td>
      <td>$${(activity.plannedValue || 0).toLocaleString()}</td>
      <td>$${(activity.earnedValue || 0).toLocaleString()}</td>
      <td>${activity.percentComplete || 0}%</td>
    `;
    tbody.appendChild(row);
  });
}

function updateResources(data) {
  const resourcesGrid = document.getElementById('resourcesGrid');
  resourcesGrid.innerHTML = '';

  if (!data.resources || data.resources.length === 0) {
    resourcesGrid.innerHTML = '<div class="no-data">No resources available</div>';
    return;
  }

  data.resources.forEach(resource => {
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = `
      <h4>${resource.name || 'Unknown'}</h4>
      <div class="resource-info">
        <p>Type: ${resource.type || 'N/A'}</p>
        <p>Max Units: ${resource.maxUnits || 0}</p>
        <p>Rate: $${(resource.rate || 0).toFixed(2)}</p>
      </div>
    `;
    resourcesGrid.appendChild(card);
  });
}

// Chart Management
function createEVChart(earnedValueData) {
  if (!earnedValueData || earnedValueData.length === 0) return;

  const ctx = document.getElementById('evChart').getContext('2d');

  const labels = earnedValueData.map(d => d.month);
  const pvData = earnedValueData.map(d => d.pv);
  const evData = earnedValueData.map(d => d.ev);
  const acData = earnedValueData.map(d => d.ac);

  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Planned Value (PV)',
          data: pvData,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Earned Value (EV)',
          data: evData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Actual Cost (AC)',
          data: acData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f1f5f9',
            font: { size: 12 }
          }
        }
      },
      scales: {
        y: {
          ticks: { color: '#cbd5e1' },
          grid: { color: '#334155' }
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { color: '#334155' }
        }
      }
    }
  });
}

function handleBreakdownChange(e) {
  const breakdown = e.target.value;
  // Implement different breakdown views
  console.log('Breakdown changed to:', breakdown);
  if (currentProject && currentProject.earnedValue) {
    createEVChart(currentProject.earnedValue);
  }
}

// Navigation
function handleNavigation(e) {
  e.preventDefault();
  const view = e.target.getAttribute('data-view');
  switchSection(view);

  // Update active menu
  menuLinks.forEach(link => link.classList.remove('active'));
  e.target.classList.add('active');
}

function switchSection(sectionId) {
  contentSections.forEach(section => section.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

// Filtering
function filterActivities() {
  const searchTerm = document.getElementById('activitySearch').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const rows = document.querySelectorAll('#activitiesBody tr');

  rows.forEach(row => {
    if (row.classList.contains('no-data')) return;

    const text = row.textContent.toLowerCase();
    const matchesSearch = text.includes(searchTerm);
    const matchesStatus = !statusFilter || text.includes(statusFilter);

    row.style.display = matchesSearch && matchesStatus ? '' : 'none';
  });
}

function applyDateFilter() {
  const from = document.getElementById('dateFrom').value;
  const to = document.getElementById('dateTo').value;

  if (!from || !to) {
    showStatus('Please select both dates', 'error');
    return;
  }

  console.log(`Date filter applied: ${from} to ${to}`);
  showStatus(`Filtered: ${from} to ${to}`, 'success');
}

// Export
async function exportFile(type) {
  if (!currentProject) {
    showStatus('No project data to export', 'error');
    return;
  }

  showLoading(true);

  try {
    const endpoint = type === 'pdf' ? '/api/export/pdf' : '/api/export/pptx';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectData: currentProject,
        dateRange: {
          from: document.getElementById('dateFrom').value,
          to: document.getElementById('dateTo').value
        }
      })
    });

    if (!response.ok) throw new Error('Export failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name || 'report'}.${type === 'pdf' ? 'pdf' : 'pptx'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showStatus(`${type.toUpperCase()} exported successfully`, 'success');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('Export failed: ' + error.message, 'error');
  } finally {
    showLoading(false);
  }
}

// Utilities
function showStatus(message, type) {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status ${type}`;

  setTimeout(() => {
    uploadStatus.textContent = '';
    uploadStatus.className = 'upload-status';
  }, 4000);
}

function showLoading(show) {
  if (show) {
    loadingSpinner.classList.remove('hidden');
    uploadProgress.classList.add('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
  }
}
