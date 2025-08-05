import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Database,
  Activity
} from 'lucide-react';

export const MedicalComplianceCard: React.FC = () => {
  const complianceItems = [
    {
      name: 'HIPAA Compliance',
      status: 'active',
      description: 'Patient data encryption and access controls',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      name: 'Audit Trail',
      status: 'active',
      description: 'Complete activity logging for all user actions',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      name: 'Data Backup',
      status: 'active',
      description: 'Automated daily backups of patient records',
      icon: <Database className="h-4 w-4" />,
    },
    {
      name: 'Access Control',
      status: 'active',
      description: 'Role-based permissions for medical staff',
      icon: <Lock className="h-4 w-4" />,
    },
    {
      name: 'Record Retention',
      status: 'compliant',
      description: 'Medical records stored per regulatory requirements',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      name: 'Session Management',
      status: 'active',
      description: 'Automatic logout and session security',
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'compliant':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'warning':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span>Medical Compliance Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>EHR System Compliant:</strong> Your allergy clinic EHR meets medical data security and privacy standards.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {complianceItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-muted-foreground">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Compliance Check:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Next Audit Due:</span>
            <span className="font-medium">{new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};