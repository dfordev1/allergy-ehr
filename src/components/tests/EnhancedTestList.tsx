import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, User, TestTube, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface EnhancedTest {
  id: string;
  test_date: string;
  patient_info: {
    name: string;
    lab_no: string;
    age_sex?: string;
    provisional_diagnosis?: string;
    referred_by?: string;
  };
  allergen_results: Record<string, string>;
  technician?: string;
  notes?: string;
  created_at: string;
}

interface EnhancedTestListProps {
  patientId: string;
  patientName?: string;
}

export const EnhancedTestList: React.FC<EnhancedTestListProps> = ({ patientId, patientName }) => {
  const [tests, setTests] = useState<EnhancedTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, [patientId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('enhanced_allergy_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (error) {
        console.error('Error fetching tests:', error);
        toast.error('Failed to load test history');
        return;
      }

      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to load test history');
    } finally {
      setLoading(false);
    }
  };

  const exportTestToPDF = async (test: EnhancedTest) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Enhanced Allergy Test Report', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });
      
      // Patient Information
      let yPos = 50;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Information', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const patientInfo = test.patient_info || {};
      pdf.text(`Name: ${patientInfo.name || patientName || 'N/A'}`, 20, yPos);
      pdf.text(`Lab No: ${patientInfo.lab_no || 'N/A'}`, 120, yPos);
      
      yPos += 7;
      pdf.text(`Age/Sex: ${patientInfo.age_sex || 'N/A'}`, 20, yPos);
      pdf.text(`Test Date: ${test.test_date || 'N/A'}`, 120, yPos);
      
      yPos += 7;
      pdf.text(`Provisional Diagnosis: ${patientInfo.provisional_diagnosis || 'N/A'}`, 20, yPos);
      
      yPos += 7;
      pdf.text(`Referred By: ${patientInfo.referred_by || 'N/A'}`, 20, yPos);
      
      // Allergen Results
      yPos += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Allergen Test Results', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const allergenResults = test.allergen_results || {};
      let resultCount = 0;
      
      for (const [allergenKey, result] of Object.entries(allergenResults)) {
        if (result && result !== '0mm') {
          yPos += 5;
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          
          const allergenName = allergenKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const whealSize = result as string;
          const numericSize = parseFloat(whealSize.replace('mm', ''));
          const testResult = numericSize >= 3 ? 'POSITIVE' : 'NEGATIVE';
          
          const resultColor = testResult === 'POSITIVE' ? [255, 0, 0] : [0, 128, 0];
          
          pdf.text(`${allergenName}:`, 25, yPos);
          pdf.text(`${whealSize}`, 120, yPos);
          
          pdf.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
          pdf.text(testResult, 150, yPos);
          pdf.setTextColor(0, 0, 0);
          
          resultCount++;
        }
      }
      
      if (resultCount === 0) {
        pdf.text('No test results recorded', 25, yPos);
      }
      
      // Additional Information
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }
      
      yPos += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Additional Information', 20, yPos);
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Technician: ${test.technician || 'N/A'}`, 20, yPos);
      
      if (test.notes) {
        yPos += 7;
        pdf.text('Notes:', 20, yPos);
        yPos += 5;
        const splitNotes = pdf.splitTextToSize(test.notes, pageWidth - 40);
        pdf.text(splitNotes, 20, yPos);
      }
      
      // Save PDF
      const fileName = `allergy-test-${patientInfo.name?.replace(/\s+/g, '-') || 'patient'}-${test.test_date}.pdf`;
      pdf.save(fileName);
      
      toast.success('Test report exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting test PDF:', error);
      toast.error('Failed to export test report to PDF');
    }
  };

  const getResultSummary = (allergenResults: Record<string, string>) => {
    let positiveCount = 0;
    let totalTested = 0;
    
    for (const [_, result] of Object.entries(allergenResults)) {
      if (result && result !== '0mm') {
        totalTested++;
        const numericSize = parseFloat(result.replace('mm', ''));
        if (numericSize >= 3) {
          positiveCount++;
        }
      }
    }
    
    return { positiveCount, totalTested };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-muted-foreground">Loading test history...</div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg mb-2">No Enhanced Allergy Tests</p>
          <p className="text-sm">Enhanced allergy tests for this patient will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enhanced Test History</h3>
        <Badge variant="outline">{tests.length} test{tests.length !== 1 ? 's' : ''}</Badge>
      </div>
      
      <div className="grid gap-4">
        {tests.map((test) => {
          const { positiveCount, totalTested } = getResultSummary(test.allergen_results);
          
          return (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Test Date: {new Date(test.test_date).toLocaleDateString()}</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportTestToPDF(test)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Patient:</strong> {test.patient_info?.name || patientName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TestTube className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Lab No:</strong> {test.patient_info?.lab_no || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Technician:</strong> {test.technician || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Test Results:</span>
                      <div className="flex space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {totalTested} tested
                        </Badge>
                        <Badge 
                          variant={positiveCount > 0 ? "destructive" : "default"} 
                          className="text-xs"
                        >
                          {positiveCount} positive
                        </Badge>
                      </div>
                    </div>
                    
                    {test.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {test.notes.substring(0, 100)}
                        {test.notes.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Created: {new Date(test.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};