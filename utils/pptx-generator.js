/**
 * PowerPoint Presentation Generator
 * Creates static slide presentations from project data
 */

const PptxGenJs = require('pptxgenjs');
const path = require('path');
const fs = require('fs').promises;
const { calculateKPIs, generateActivitySummary } = require('./calculations');

async function generatePPTX(projectData, dateRange, tempDir) {
  try {
    const fileName = `presentation_${Date.now()}.pptx`;
    const filePath = path.join(tempDir, fileName);

    const pres = new PptxGenJs();

    // Presentation settings
    pres.defineLayout({ name: 'LAYOUT1', width: 10, height: 5.625 });
    pres.defineLayout({ name: 'LAYOUT2', width: 10, height: 5.625 });

    const colors = {
      primary: '0284c7',
      darkBg: '1e293b',
      lightBg: 'f0f9ff',
      text: '0f172a',
      accent: '38bdf8'
    };

    // Slide 1: Title Slide
    const slide1 = pres.addSlide();
    slide1.background = { color: colors.darkBg };

    slide1.addText(projectData.project_name || 'Project Report', {
      x: 0.5, y: 1.5, w: 9, h: 1,
      fontSize: 54,
      bold: true,
      color: 'ffffff',
      align: 'center'
    });

    slide1.addText('Project Analysis & Earned Value Report', {
      x: 0.5, y: 2.6, w: 9, h: 0.5,
      fontSize: 28,
      color: colors.accent,
      align: 'center'
    });

    slide1.addText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 0.5, y: 4.5, w: 9, h: 0.4,
      fontSize: 14,
      color: 'cbd5e1',
      align: 'center'
    });

    // Slide 2: Executive Summary
    const slide2 = pres.addSlide();
    slide2.background = { color: 'ffffff' };

    const kpis = calculateKPIs(projectData);

    slide2.addText('Executive Summary', {
      x: 0.5, y: 0.3, w: 9, h: 0.4,
      fontSize: 40,
      bold: true,
      color: colors.text
    });

    // KPI Cards
    const cardData = [
      { label: 'Planned Value', value: `$${kpis.totalPlannedValue.toLocaleString()}` },
      { label: 'Earned Value', value: `$${kpis.totalEarnedValue.toLocaleString()}` },
      { label: 'Actual Cost', value: `$${kpis.totalActualCost.toLocaleString()}` },
      { label: 'Project Health', value: kpis.health }
    ];

    const cardWidth = 2;
    const cardHeight = 1.5;
    cardData.forEach((card, index) => {
      const xPos = 0.5 + (index * cardWidth + index * 0.3);
      const yPos = 1;

      slide2.addShape(pres.ShapeType.rect, {
        x: xPos, y: yPos, w: cardWidth, h: cardHeight,
        fill: { color: colors.lightBg },
        line: { color: colors.primary, width: 2 }
      });

      slide2.addText(card.label, {
        x: xPos + 0.1, y: yPos + 0.15, w: cardWidth - 0.2, h: 0.4,
        fontSize: 11,
        bold: true,
        color: colors.text
      });

      slide2.addText(card.value, {
        x: xPos + 0.1, y: yPos + 0.65, w: cardWidth - 0.2, h: 0.7,
        fontSize: 20,
        bold: true,
        color: colors.primary,
        align: 'center'
      });
    });

    // Performance Indices
    slide2.addText('Performance Indices', {
      x: 0.5, y: 3, w: 9, h: 0.3,
      fontSize: 18,
      bold: true,
      color: colors.text
    });

    const indexText = [
      `Schedule Performance Index (SPI): ${kpis.schedulePerformanceIndex.toFixed(3)}`,
      `Cost Performance Index (CPI): ${kpis.costPerformanceIndex.toFixed(3)}`,
      `Schedule Variance: ${kpis.scheduleVariance}`,
      `Cost Variance: ${kpis.costVariance}`
    ];

    let yOffset = 3.4;
    indexText.forEach(text => {
      slide2.addText(text, {
        x: 0.8, y: yOffset, w: 8.4, h: 0.3,
        fontSize: 13,
        color: colors.text
      });
      yOffset += 0.35;
    });

    // Slide 3: Activities Summary
    const slide3 = pres.addSlide();
    slide3.background = { color: 'ffffff' };

    slide3.addText('Activities Summary', {
      x: 0.5, y: 0.3, w: 9, h: 0.4,
      fontSize: 40,
      bold: true,
      color: colors.text
    });

    const activitySummary = generateActivitySummary(projectData.activities || []);

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Activities', activitySummary.total.toString()],
      ['Completed', activitySummary.completed.toString()],
      ['In Progress', activitySummary.inProgress.toString()],
      ['Not Started', activitySummary.notStarted.toString()],
      ['Completion Rate', `${activitySummary.completionRate}%`]
    ];

    slide3.addTable(summaryData, {
      x: 1, y: 1.2, w: 8, h: 3,
      border: { pt: 1, color: colors.primary },
      fill: { color: colors.lightBg },
      rowH: 0.45,
      colW: [4, 2],
      align: 'left',
      valign: 'middle',
      fontSize: 14,
      bold: [true, true], // Make header bold
      color: [colors.text, colors.text]
    });

    // Slide 4: Activities List (if any activities exist)
    if ((projectData.activities || []).length > 0) {
      const slide4 = pres.addSlide();
      slide4.background = { color: 'ffffff' };

      slide4.addText('Activities Detail', {
        x: 0.5, y: 0.3, w: 9, h: 0.4,
        fontSize: 40,
        bold: true,
        color: colors.text
      });

      const activitiesData = [
        ['Activity Name', 'Status', '% Complete']
      ];

      (projectData.activities || []).slice(0, 12).forEach(activity => {
        activitiesData.push([
          activity.name || 'N/A',
          activity.status || 'N/A',
          `${activity.percentComplete || 0}%`
        ]);
      });

      slide4.addTable(activitiesData, {
        x: 0.5, y: 1, w: 9, h: 4.2,
        border: { pt: 1, color: colors.primary },
        fill: { color: colors.lightBg },
        rowH: 0.35,
        colW: [5, 2, 1.5],
        align: 'left',
        valign: 'middle',
        fontSize: 11,
        bold: [true, true, true],
        color: colors.text
      });
    }

    // Slide 5: Conclusion
    const slide5 = pres.addSlide();
    slide5.background = { color: colors.darkBg };

    slide5.addText('Project Status', {
      x: 0.5, y: 1.5, w: 9, h: 0.6,
      fontSize: 44,
      bold: true,
      color: 'ffffff'
    });

    const healthColor = kpis.health === 'On Track' ? '10b981' : 
                       kpis.health === 'Warning' ? 'f59e0b' : 'ef4444';

    slide5.addShape(pres.ShapeType.rect, {
      x: 3, y: 2.5, w: 4, h: 1.2,
      fill: { color: healthColor }
    });

    slide5.addText(kpis.health, {
      x: 3, y: 2.5, w: 4, h: 1.2,
      fontSize: 36,
      bold: true,
      color: 'ffffff',
      align: 'center',
      valign: 'middle'
    });

    slide5.addText('Thank You', {
      x: 0.5, y: 4.5, w: 9, h: 0.5,
      fontSize: 24,
      color: colors.accent,
      align: 'center'
    });

    // Save presentation
    await pres.save({ path: filePath });

    return filePath;
  } catch (error) {
    console.error('PPTX generation error:', error);
    throw error;
  }
}

module.exports = { generatePPTX };
