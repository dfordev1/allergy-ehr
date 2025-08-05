import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AllergenResult {
  allergen: string;
  wheal_size: number;
  is_positive: boolean;
}

interface TestResult {
  id: string;
  testdate: string;
  technician: string;
  status: string;
  results: any;
  controls: any;
  notes: string;
}

interface AllergyTestTableProps {
  patientId: string;
  onAddTest: () => void;
}

export const AllergyTestTable = ({ patientId, onAddTest }: AllergyTestTableProps) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchTestResults();
  }, [patientId]);

  const fetchTestResults = async () => {
    try {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('patientid', patientId)
        .order('testdate', { ascending: false });

      if (error) {
        toast.error('Error fetching test results');
        return;
      }

      setTestResults(data || []);
    } catch (error) {
      toast.error('Error fetching test results');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading test results...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Allergy Test History</CardTitle>
            <Button onClick={onAddTest} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No allergy tests recorded yet.</p>
              <Button onClick={onAddTest}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Test
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Positive Results</TableHead>
                  <TableHead>Total Allergens</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {testResults.map((test) => {
                const results = Array.isArray(test.results) ? test.results : [];
                const positiveCount = results.filter((r: AllergenResult) => r.is_positive).length;
                  
                  return (
                    <TableRow key={test.id}>
                      <TableCell>
                        {new Date(test.testdate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{test.technician}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{positiveCount}</span>
                      </TableCell>
                      <TableCell>{results.length}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTest(test)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Test Results Modal/Card */}
      {selectedTest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Test Results - {new Date(selectedTest.testdate).toLocaleDateString()}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTest(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Technician: </span>
                  <span className="font-medium">{selectedTest.technician}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge className={getStatusColor(selectedTest.status)}>
                    {selectedTest.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium">
                    {new Date(selectedTest.testdate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedTest.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground">{selectedTest.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Allergen Results:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Allergen</TableHead>
                      <TableHead>Wheal Size (mm)</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(selectedTest.results) && selectedTest.results.map((result: AllergenResult, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.allergen}</TableCell>
                        <TableCell>{result.wheal_size}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {result.is_positive ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600 font-medium">Positive</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Negative</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {Array.isArray(selectedTest.controls) && selectedTest.controls.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Controls:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTest.controls.map((control: any, index: number) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{control.type} Control</span>
                          <span>{control.wheal_size}mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};