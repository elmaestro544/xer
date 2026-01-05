/**
 * PDF Report Generator
 * Creates detailed PDF reports with charts and metrics
 */

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { calculateKPIs, generateActivitySummary } = require('./calculations');

async function generatePDF(projectData, dateRange, tempDir) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `report_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const stream = require('fs').createWriteStream(filePath);

      doc.on('error', reject);
      stream.on('error', reject);
      stream.on('finish', () => resolve(filePath));

      doc.pipe(stream);

      // Title Page
      doc.fontSize(32).font('Helvetica-Bold').text(projectData.project_name || 'Project Report', {
        align: 'center'
      });

      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica').fillColor('#666666')
        .text('Project Analysis & Earned Value Report', { align: 'center' });

      doc.moveDown(2);
      doc.fontSize(11).fillColor('#000000');
      doc.text(`Project ID: ${projectData.project_id || 'N/A'}`);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Start Date: ${projectData.project_start_date || 'N/A'}`);
      doc.text(`End Date: ${projectData.project_end_date || 'N/A'}`);

      // KPIs Section
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary', { underline: true });
      doc.moveDown(0.5);

      const kpis = calculateKPIs(projectData);
      const activitySummary = generateActivitySummary(projectData.activities || []);

      // KPI Box
      doc.fontSize(10).font('Helvetica');
      const boxTop = doc.y;
      const boxHeight = 120;

      // Background
      doc.rect(50, boxTop, 500, boxHeight).fillAndStroke('#f0f9ff', '#0284c7');
      doc.fillColor('#1e40af').fontSize(11).font('Helvetica-Bold');

      const kpiText = [
        `Planned Value (Budget): $${kpis.totalPlannedValue.toLocaleString()}`,
        `Earned Value: $${kpis.totalEarnedValue.toLocaleString()}`,
        `Actual Cost: $${kpis.totalActualCost.toLocaleString()}`,
        `Schedule Performance Index (SPI): ${kpis.schedulePerformanceIndex.toFixed(3)}`,
        `Cost Performance Index (CPI): ${kpis.costPerformanceIndex.toFixed(3)}`,
        `Project Health: ${kpis.health}`
      ];

      doc.y = boxTop + 10;
      kpiText.forEach(text => {
        doc.text(text, 60);
      });

      doc.moveDown(8);

      // Activities Summary
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Activities Summary', { underline: true });
      doc.fontSize(10).font('Helvetica').moveDown(0.5);

      doc.text(`Total Activities: ${activitySummary.total}`);
      doc.text(`Completed: ${activitySummary.completed}`);
      doc.text(`In Progress: ${activitySummary.inProgress}`);
      doc.text(`Not Started: ${activitySummary.notStarted}`);
      doc.text(`Overall Completion: ${activitySummary.completionRate}%`);

      // Activities Table
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Activities Detail', { underline: true });
      doc.moveDown(0.5);

      const activities = (projectData.activities || []).slice(0, 20); // Limit to 20 for space

      if (activities.length > 0) {
        doc.fontSize(9).font('Helvetica');

        // Table header
        const tableTop = doc.y;
        const colWidth = 95;

        doc.fillColor('#1e40af');
        doc.rect(50, tableTop, colWidth, 20).fill();
        doc.rect(50 + colWidth, tableTop, colWidth, 20).fill();
        doc.rect(50 + colWidth * 2, tableTop, colWidth, 20).fill();
        doc.rect(50 + colWidth * 3, tableTop, colWidth, 20).fill();
        doc.rect(50 + colWidth * 4, tableTop, colWidth, 20).fill();

        doc.fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Activity', 60, tableTop + 5, { width: colWidth - 20 });
        doc.text('Status', 60 + colWidth, tableTop + 5, { width: colWidth - 20 });
        doc.text('Start Date', 60 + colWidth * 2, tableTop + 5, { width: colWidth - 20 });
        doc.text('End Date', 60 + colWidth * 3, tableTop + 5, { width: colWidth - 20 });
        doc.text('% Complete', 60 + colWidth * 4, tableTop + 5, { width: colWidth - 20 });

        doc.fillColor('#000000').font('Helvetica');

        let yPos = tableTop + 20;
        activities.forEach((activity, index) => {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }

          const rowHeight = 15;

          // Alternate row colors
          if (index % 2 === 0) {
            doc.fillColor('#f9fafb');
            doc.rect(50, yPos, colWidth * 5, rowHeight).fill();
          }

          doc.fillColor('#000000');
          doc.text(activity.name || 'N/A', 60, yPos + 3, { width: colWidth - 20, height: 10 });
          doc.text(activity.status || 'N/A', 60 + colWidth, yPos + 3, { width: colWidth - 20 });
          doc.text(activity.startDate || 'N/A', 60 + colWidth * 2, yPos + 3, { width: colWidth - 20 });
          doc.text(activity.endDate || 'N/A', 60 + colWidth * 3, yPos + 3, { width: colWidth - 20 });
          doc.text(`${activity.percentComplete || 0}%`, 60 + colWidth * 4, yPos + 3, { width: colWidth - 20 });

          yPos += rowHeight;
        });
      }

      // Footer
      doc.addPage();
      doc.fontSize(10).fillColor('#666666').text('End of Report', { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePDF };
