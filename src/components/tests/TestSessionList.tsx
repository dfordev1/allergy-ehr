import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestSession {
  id: string;
  testdate: string;
  technician: string;
  status: string;
  notes: string;
  results: any;
  controls: any;
  createdat: string;
}

interface TestSessionListProps {
  patientId: string;
}

export const TestSessionList = ({ patientId }: TestSessionListProps) => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestSessions();
  }, [patientId]);

  const fetchTestSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('patientid', patientId)
        .order('testdate', { ascending: false });

      if (error) {
        toast.error('Error fetching test sessions');
        return;
      }

      setSessions(data || []);
    } catch (error) {
      toast.error('Error fetching test sessions');
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
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading test sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No test sessions found</h3>
          <p className="text-muted-foreground">
            This patient doesn't have any test sessions yet. Add one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Test Sessions</h3>
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{new Date(session.testdate).toLocaleDateString()}</span>
              </CardTitle>
              <Badge className={getStatusColor(session.status)}>
                {session.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Technician: {session.technician}</span>
              </div>

              {session.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm">{session.notes}</p>
                </div>
              )}

              {session.results && Array.isArray(session.results) && session.results.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Allergen Results:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {session.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{result.allergen}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{result.wheal_size}mm</span>
                          {result.is_positive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.controls && Array.isArray(session.controls) && session.controls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Controls:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {session.controls.map((control: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded bg-gray-50"
                      >
                        <span className="text-sm font-medium">{control.type}</span>
                        <span className="text-sm">{control.wheal_size}mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};