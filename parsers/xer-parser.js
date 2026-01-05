/**
 * XER File Parser
 * Parses Primavera P6 XER format files
 */

class XERParser {
  constructor(content) {
    this.content = content;
    this.tables = {};
    this.metadata = {};
  }

  parse() {
    try {
      const lines = this.content.split('\n');
      let currentTable = null;
      let currentFields = [];
      const data = {};

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('%T')) {
          // Table declaration: %T	TASK
          currentTable = line.split('\t')[1];
          data[currentTable] = [];
          currentFields = [];
        } else if (line.startsWith('%F')) {
          // Field declaration: %F	TASK_ID	task_id	TASK_ID
          const parts = line.split('\t');
          currentFields.push(parts[1]);
        } else if (line.startsWith('%R')) {
          // Record: %R	1	task1	...
          if (currentTable && currentFields.length > 0) {
            const parts = line.substring(2).split('\t');
            const record = {};
            currentFields.forEach((field, index) => {
              record[field] = parts[index] || null;
            });
            data[currentTable].push(record);
          }
        } else if (line.startsWith('%E')) {
          // End of file
          break;
        }
      }

      return this.buildProjectData(data);
    } catch (error) {
      console.error('XER Parse error:', error);
      return null;
    }
  }

  buildProjectData(tables) {
    // Extract PROJECT info
    const projects = tables.PROJNODE || [];
    const project = projects[0] || {};

    // Extract TASK (activities) data
    const tasks = tables.TASK || [];
    const activities = tasks.map(task => ({
      id: task.task_id,
      name: task.task_name,
      startDate: task.start_date,
      endDate: task.end_date,
      duration: parseInt(task.duration) || 0,
      percentComplete: parseFloat(task.percent_complete) || 0,
      actualStart: task.actual_start_date,
      actualFinish: task.actual_finish_date,
      plannedValue: parseFloat(task.planned_value) || 0,
      earnedValue: parseFloat(task.earned_value) || 0,
      actualCost: parseFloat(task.actual_cost) || 0,
      status: task.status_code || 'Not Started'
    }));

    // Extract RESOURCE data
    const resources = tables.RSRC || [];
    const resourceList = resources.map(rsrc => ({
      id: rsrc.rsrc_id,
      name: rsrc.rsrc_name,
      type: rsrc.rsrc_type || 'Material',
      maxUnits: parseFloat(rsrc.max_units) || 0,
      rate: parseFloat(rsrc.rate) || 0
    }));

    // Extract TASKRSRC (task-resource assignments)
    const taskResources = tables.TASKRSRC || [];

    return {
      project_id: project.proj_id,
      project_name: project.proj_short_name || 'Unnamed Project',
      project_status: project.status_code || 'Not Started',
      project_start_date: project.start_date,
      project_end_date: project.end_date,
      project_manager: project.project_manager || 'N/A',
      activities,
      resources: resourceList,
      taskResources,
      tables
    };
  }

  // Helper: Calculate project metrics
  calculateMetrics() {
    const activities = this.parse().activities || [];
    
    const totalPlannedValue = activities.reduce((sum, a) => sum + (a.plannedValue || 0), 0);
    const totalEarnedValue = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalActualCost = activities.reduce((sum, a) => sum + (a.actualCost || 0), 0);

    return {
      totalPlannedValue,
      totalEarnedValue,
      totalActualCost,
      schedulePerformanceIndex: totalPlannedValue > 0 ? totalEarnedValue / totalPlannedValue : 0,
      costPerformanceIndex: totalActualCost > 0 ? totalEarnedValue / totalActualCost : 0
    };
  }
}

module.exports = XERParser;
