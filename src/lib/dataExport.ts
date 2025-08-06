// ============================================================================
// COMPREHENSIVE DATA EXPORT SYSTEM
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { performanceMonitor } from '@/lib/performance';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  includeHeaders: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  fields?: string[];
  template?: string;
  fileName?: string;
}

export interface ExportJob {
  id: string;
  table: string;
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class DataExportManager {
  private jobs = new Map<string, ExportJob>();
  private batchSize = 1000;

  async exportData(table: string, options: ExportOptions): Promise<string> {
    const jobId = this.generateJobId();
    
    const job: ExportJob = {
      id: jobId,
      table,
      options,
      status: 'pending',
      progress: 0,
      totalRecords: 0,
      processedRecords: 0,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Start export process
    this.processExportJob(jobId);
    
    return jobId;
  }

  private async processExportJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      
      // Get total count first
      const totalCount = await this.getTotalCount(job.table, job.options);
      job.totalRecords = totalCount;

      // Fetch data in batches
      const allData: any[] = [];
      let offset = 0;

      while (offset < totalCount) {
        const batchData = await this.fetchBatch(job.table, job.options, offset, this.batchSize);
        allData.push(...batchData);
        
        offset += this.batchSize;
        job.processedRecords = Math.min(offset, totalCount);
        job.progress = Math.round((job.processedRecords / totalCount) * 100);
        
        // Update progress
        this.notifyProgress(job);
      }

      // Generate export file
      const exportData = await this.generateExportFile(allData, job.options);
      job.downloadUrl = exportData.url;
      job.status = 'completed';
      job.completedAt = new Date();
      
      toast.success(`Export completed: ${job.processedRecords} records exported`);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Export failed';
      toast.error(`Export failed: ${job.error}`);
    }
  }

  private async getTotalCount(table: string, options: ExportOptions): Promise<number> {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    
    // Apply filters
    query = this.applyFilters(query, options);
    
    const { count, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get record count: ${error.message}`);
    }
    
    return count || 0;
  }

  private async fetchBatch(
    table: string,
    options: ExportOptions,
    offset: number,
    limit: number
  ): Promise<any[]> {
    let query = supabase.from(table).select('*');
    
    // Apply filters
    query = this.applyFilters(query, options);
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch batch: ${error.message}`);
    }
    
    return data || [];
  }

  private applyFilters(query: any, options: ExportOptions): any {
    // Apply date range filter
    if (options.dateRange) {
      const dateField = this.getDateField(query);
      if (dateField) {
        query = query.gte(dateField, options.dateRange.start);
        query = query.lte(dateField, options.dateRange.end);
      }
    }

    // Apply custom filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(field, value);
        }
      });
    }

    return query;
  }

  private getDateField(table: string): string | null {
    const dateFields: Record<string, string> = {
      patients: 'dateoftesting',
      bookings: 'appointment_date',
      enhanced_allergy_tests: 'test_date',
      test_sessions: 'test_date'
    };
    
    return dateFields[table] || 'created_at';
  }

  private async generateExportFile(data: any[], options: ExportOptions): Promise<{ url: string; blob: Blob }> {
    const endMeasurement = performanceMonitor.recordUserAction('generate_export_file', 'DataExport');
    
    try {
      let blob: Blob;
      let fileName = options.fileName || `export_${Date.now()}`;

      switch (options.format) {
        case 'csv':
          blob = await this.generateCSV(data, options);
          fileName += '.csv';
          break;
        
        case 'json':
          blob = await this.generateJSON(data, options);
          fileName += '.json';
          break;
        
        case 'pdf':
          blob = await this.generatePDF(data, options);
          fileName += '.pdf';
          break;
        
        case 'excel':
          blob = await this.generateExcel(data, options);
          fileName += '.xlsx';
          break;
        
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      // Create download URL
      const url = URL.createObjectURL(blob);
      
      return { url, blob };
    } finally {
      endMeasurement();
    }
  }

  private async generateCSV(data: any[], options: ExportOptions): Promise<Blob> {
    if (data.length === 0) {
      return new Blob(['No data to export'], { type: 'text/csv' });
    }

    const fields = options.fields || Object.keys(data[0]);
    const headers = options.includeHeaders ? fields.join(',') + '\n' : '';
    
    const csvContent = data.map(row => 
      fields.map(field => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        
        // Handle objects and arrays
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',')
    ).join('\n');

    return new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8' });
  }

  private async generateJSON(data: any[], options: ExportOptions): Promise<Blob> {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
        fields: options.fields || (data.length > 0 ? Object.keys(data[0]) : []),
        filters: options.filters,
        dateRange: options.dateRange
      },
      data: options.fields ? data.map(row => 
        Object.fromEntries(options.fields!.map(field => [field, row[field]]))
      ) : data
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    return new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  }

  private async generatePDF(data: any[], options: ExportOptions): Promise<Blob> {
    // For PDF generation, we'll create a simple HTML structure and convert it
    const fields = options.fields || (data.length > 0 ? Object.keys(data[0]) : []);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { margin-bottom: 20px; }
          .metadata { background: #f5f5f5; padding: 10px; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Data Export Report</h1>
          <div class="metadata">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Records:</strong> ${data.length}</p>
            ${options.dateRange ? `<p><strong>Date Range:</strong> ${options.dateRange.start} to ${options.dateRange.end}</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              ${fields.map(field => `<th>${this.formatFieldName(field)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${fields.map(field => {
                  const value = row[field];
                  if (value === null || value === undefined) return '<td></td>';
                  if (typeof value === 'object') return `<td>${JSON.stringify(value)}</td>`;
                  return `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // For now, return HTML as PDF placeholder
    // In a real implementation, you'd use a library like jsPDF or Puppeteer
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  }

  private async generateExcel(data: any[], options: ExportOptions): Promise<Blob> {
    // For Excel generation, we'll create a CSV with Excel-specific formatting
    // In a real implementation, you'd use a library like SheetJS
    const csvBlob = await this.generateCSV(data, options);
    return csvBlob;
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private notifyProgress(job: ExportJob): void {
    // In a real implementation, you might use WebSockets or Server-Sent Events
    // For now, we'll just log the progress
    console.log(`Export ${job.id}: ${job.progress}% (${job.processedRecords}/${job.totalRecords})`);
  }

  private generateJobId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for managing export jobs
  getJob(jobId: string): ExportJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ExportJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  clearCompletedJobs(): void {
    Array.from(this.jobs.entries()).forEach(([id, job]) => {
      if (job.status === 'completed' || job.status === 'failed') {
        if (job.downloadUrl) {
          URL.revokeObjectURL(job.downloadUrl);
        }
        this.jobs.delete(id);
      }
    });
  }

  // Download helpers
  downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export templates
  getExportTemplates(table: string): Array<{ name: string; options: Partial<ExportOptions> }> {
    const templates: Record<string, Array<{ name: string; options: Partial<ExportOptions> }>> = {
      patients: [
        {
          name: 'Basic Patient Info',
          options: {
            fields: ['name', 'age', 'sex', 'labno', 'dateoftesting'],
            includeHeaders: true,
            format: 'csv'
          }
        },
        {
          name: 'Complete Patient Record',
          options: {
            includeHeaders: true,
            format: 'json'
          }
        },
        {
          name: 'Patient Report (PDF)',
          options: {
            fields: ['name', 'age', 'sex', 'provisionaldiagnosis', 'referringphysician'],
            includeHeaders: true,
            format: 'pdf'
          }
        }
      ],
      bookings: [
        {
          name: 'Appointment Schedule',
          options: {
            fields: ['appointment_date', 'appointment_time', 'test_type', 'status'],
            includeHeaders: true,
            format: 'csv'
          }
        },
        {
          name: 'Booking Summary',
          options: {
            includeHeaders: true,
            format: 'excel'
          }
        }
      ],
      enhanced_allergy_tests: [
        {
          name: 'Test Results Summary',
          options: {
            fields: ['test_date', 'patient_info', 'interpretation', 'is_completed'],
            includeHeaders: true,
            format: 'csv'
          }
        },
        {
          name: 'Complete Test Report',
          options: {
            includeHeaders: true,
            format: 'pdf'
          }
        }
      ]
    };

    return templates[table] || [];
  }
}

// Export singleton instance
export const dataExportManager = new DataExportManager();

// React hook for data export
export function useDataExport() {
  const [jobs, setJobs] = React.useState<ExportJob[]>([]);

  const refreshJobs = React.useCallback(() => {
    setJobs(dataExportManager.getAllJobs());
  }, []);

  React.useEffect(() => {
    refreshJobs();
    
    // Refresh jobs every 2 seconds to show progress updates
    const interval = setInterval(refreshJobs, 2000);
    
    return () => clearInterval(interval);
  }, [refreshJobs]);

  const exportData = React.useCallback(async (table: string, options: ExportOptions) => {
    const jobId = await dataExportManager.exportData(table, options);
    refreshJobs();
    return jobId;
  }, [refreshJobs]);

  const downloadJob = React.useCallback((job: ExportJob) => {
    if (job.downloadUrl && job.status === 'completed') {
      const fileName = job.options.fileName || `${job.table}_export_${job.id}`;
      dataExportManager.downloadFile(job.downloadUrl, fileName);
    }
  }, []);

  const cancelJob = React.useCallback((jobId: string) => {
    dataExportManager.cancelJob(jobId);
    refreshJobs();
  }, [refreshJobs]);

  const clearCompleted = React.useCallback(() => {
    dataExportManager.clearCompletedJobs();
    refreshJobs();
  }, [refreshJobs]);

  return {
    jobs,
    exportData,
    downloadJob,
    cancelJob,
    clearCompleted,
    getTemplates: dataExportManager.getExportTemplates.bind(dataExportManager)
  };
}

export default dataExportManager;