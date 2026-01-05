/**
 * Earned Value Analysis & KPI Calculations
 */

function calculateKPIs(projectData) {
  const activities = projectData.activities || [];
  
  // Calculate totals
  const totalPV = activities.reduce((sum, a) => sum + (a.plannedValue || 0), 0);
  const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
  const totalAC = activities.reduce((sum, a) => sum + (a.actualCost || 0), 0);
  
  // Calculate percentages
  const percentComplete = totalPV > 0 ? (totalEV / totalPV) * 100 : 0;
  
  // Performance Indices
  const SPI = totalEV / (totalPV || 1); // Schedule Performance Index
  const CPI = totalEV / (totalAC || 1); // Cost Performance Index
  
  // Projections
  const EAC = totalAC / (CPI || 1); // Estimate at Completion
  const VAC = totalPV - totalEV; // Value at Completion (overrun)
  
  // Schedule variance
  const SV = totalEV - totalPV; // Schedule Variance
  const CV = totalEV - totalAC; // Cost Variance

  return {
    totalPlannedValue: Math.round(totalPV * 100) / 100,
    totalEarnedValue: Math.round(totalEV * 100) / 100,
    totalActualCost: Math.round(totalAC * 100) / 100,
    percentComplete: Math.round(percentComplete * 100) / 100,
    schedulePerformanceIndex: Math.round(SPI * 10000) / 10000,
    costPerformanceIndex: Math.round(CPI * 10000) / 10000,
    scheduleVariance: Math.round(SV * 100) / 100,
    costVariance: Math.round(CV * 100) / 100,
    estimateAtCompletion: Math.round(EAC * 100) / 100,
    varianceAtCompletion: Math.round(VAC * 100) / 100,
    budget: Math.round(totalPV * 100) / 100,
    health: SPI >= 0.95 && CPI >= 0.95 ? 'On Track' : SPI < 0.90 || CPI < 0.90 ? 'At Risk' : 'Warning'
  };
}

function calculateEarnedValue(projectData) {
  const activities = projectData.activities || [];
  const timeline = {};

  // Group by month
  activities.forEach(activity => {
    if (!activity.startDate) return;

    const date = new Date(activity.startDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!timeline[monthKey]) {
      timeline[monthKey] = { pv: 0, ev: 0, ac: 0 };
    }

    timeline[monthKey].pv += activity.plannedValue || 0;
    timeline[monthKey].ev += activity.earnedValue || 0;
    timeline[monthKey].ac += activity.actualCost || 0;
  });

  // Calculate cumulative values
  const cumulative = [];
  let cumulativePV = 0, cumulativeEV = 0, cumulativeAC = 0;

  Object.keys(timeline).sort().forEach(month => {
    cumulativePV += timeline[month].pv;
    cumulativeEV += timeline[month].ev;
    cumulativeAC += timeline[month].ac;

    cumulative.push({
      month,
      pv: Math.round(cumulativePV * 100) / 100,
      ev: Math.round(cumulativeEV * 100) / 100,
      ac: Math.round(cumulativeAC * 100) / 100,
      spi: cumulativePV > 0 ? Math.round((cumulativeEV / cumulativePV) * 10000) / 10000 : 0,
      cpi: cumulativeAC > 0 ? Math.round((cumulativeEV / cumulativeAC) * 10000) / 10000 : 0
    });
  });

  return cumulative;
}

function calculateProjectHealth(kpis) {
  const { schedulePerformanceIndex, costPerformanceIndex } = kpis;

  if (schedulePerformanceIndex >= 0.95 && costPerformanceIndex >= 0.95) {
    return { status: 'On Track', color: '#10b981', score: 100 };
  } else if (schedulePerformanceIndex >= 0.90 && costPerformanceIndex >= 0.90) {
    return { status: 'Warning', color: '#f59e0b', score: 75 };
  } else if (schedulePerformanceIndex >= 0.80 && costPerformanceIndex >= 0.80) {
    return { status: 'At Risk', color: '#ef4444', score: 50 };
  } else {
    return { status: 'Critical', color: '#7f1d1d', score: 25 };
  }
}

function generateActivitySummary(activities) {
  const completed = activities.filter(a => a.percentComplete >= 100).length;
  const inProgress = activities.filter(a => a.percentComplete > 0 && a.percentComplete < 100).length;
  const notStarted = activities.filter(a => a.percentComplete === 0).length;

  return {
    total: activities.length,
    completed,
    inProgress,
    notStarted,
    completionRate: activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0
  };
}

module.exports = {
  calculateKPIs,
  calculateEarnedValue,
  calculateProjectHealth,
  generateActivitySummary
};
