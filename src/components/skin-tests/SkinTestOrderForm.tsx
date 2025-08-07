import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestTube, User, Calendar, AlertTriangle, Plus, X, Search } from 'lucide-react';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { toast } from 'sonner';

const skinTestOrderSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  ordered_by: z.string().min(1, 'Ordering physician is required'),
  priority: z.enum(['routine', 'urgent', 'stat']),
  test_panels: z.array(z.string()).min(1, 'At least one test panel is required'),
  custom_allergens: z.array(z.string()),
  instructions: z.string().optional(),
  insurance_authorization: z.string().optional(),
});

type SkinTestOrderFormData = z.infer<typeof skinTestOrderSchema>;

interface SkinTestOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preselectedPatientId?: string;
}

interface TestPanel {
  id: string;
  name: string;
  description: string;
  allergens: string[];
  category: string;
}

interface CustomAllergen {
  id: string;
  name: string;
  category: string;
  concentration: string;
}

export const SkinTestOrderForm: React.FC<SkinTestOrderFormProps> = ({
  onSuccess,
  onCancel,
  preselectedPatientId
}) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [testPanels, setTestPanels] = useState<TestPanel[]>([]);
  const [customAllergens, setCustomAllergens] = useState<CustomAllergen[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [selectedCustomAllergens, setSelectedCustomAllergens] = useState<string[]>([]);
  const [patientSearch, setPatientSearch] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SkinTestOrderFormData>({
    resolver: zodResolver(skinTestOrderSchema),
    defaultValues: {
      patient_id: preselectedPatientId || '',
      priority: 'routine',
      test_panels: [],
      custom_allergens: [],
      instructions: ''
    }
  });

  useEffect(() => {
    loadFormData();
    if (preselectedPatientId) {
      setValue('patient_id', preselectedPatientId);
    }
  }, [preselectedPatientId, setValue]);

  const loadFormData = async () => {
    try {
      const [panelsResult, allergensResult] = await Promise.all([
        AllergyPracticeApiService.getSkinTestPanels(),
        AllergyPracticeApiService.getCustomAllergens()
      ]);

      if (panelsResult.data) {
        setTestPanels(panelsResult.data);
      }

      if (allergensResult.data) {
        setCustomAllergens(allergensResult.data);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form data');
    }
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const result = await AllergyPracticeApiService.searchPatients(query);
      if (result.data) {
        setPatients(result.data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    searchPatients(query);
  };

  const handlePanelToggle = (panelId: string) => {
    const newSelectedPanels = selectedPanels.includes(panelId)
      ? selectedPanels.filter(id => id !== panelId)
      : [...selectedPanels, panelId];
    
    setSelectedPanels(newSelectedPanels);
    setValue('test_panels', newSelectedPanels);
  };

  const handleCustomAllergenToggle = (allergenId: string) => {
    const newSelectedAllergens = selectedCustomAllergens.includes(allergenId)
      ? selectedCustomAllergens.filter(id => id !== allergenId)
      : [...selectedCustomAllergens, allergenId];
    
    setSelectedCustomAllergens(newSelectedAllergens);
    setValue('custom_allergens', newSelectedAllergens);
  };

  const onSubmit = async (data: SkinTestOrderFormData) => {
    setLoading(true);
    try {
      const orderData = {
        ...data,
        order_date: new Date().toISOString(),
        status: 'ordered' as const,
        test_panels: selectedPanels,
        custom_allergens: selectedCustomAllergens
      };

      const result = await AllergyPracticeApiService.createSkinTestOrder(orderData);
      
      if (result.data) {
        toast.success('Skin test order created successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating skin test order:', error);
      toast.error('Failed to create skin test order');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTotalAllergens = () => {
    const panelAllergens = testPanels
      .filter(panel => selectedPanels.includes(panel.id))
      .reduce((total, panel) => total + panel.allergens.length, 0);
    
    return panelAllergens + selectedCustomAllergens.length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>New Skin Test Order</span>
            <Badge variant="outline" className="ml-2">
              {getTotalAllergens()} allergens selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <Card className="bg-blue-50/30 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient_search">Search Patient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="patient_search"
                        value={patientSearch}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        placeholder="Search by name or lab number..."
                        className="pl-9"
                        disabled={!!preselectedPatientId}
                      />
                    </div>
                    {patients.length > 0 && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {patients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0"
                            onClick={() => {
                              setValue('patient_id', patient.id);
                              setPatientSearch(`${patient.name} (${patient.labno})`);
                              setPatients([]);
                            }}
                          >
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-gray-500">
                              {patient.age}y {patient.sex} • Lab: {patient.labno}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.patient_id && (
                      <p className="text-sm text-destructive">{errors.patient_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ordered_by">Ordering Physician</Label>
                    <Input
                      id="ordered_by"
                      {...register('ordered_by')}
                      placeholder="Dr. Smith"
                    />
                    {errors.ordered_by && (
                      <p className="text-sm text-destructive">{errors.ordered_by.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="bg-orange-50/30 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Order Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={watch('priority')}
                      onValueChange={(value: any) => setValue('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">Routine</Badge>
                            <span>Standard processing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-orange-100 text-orange-800">Urgent</Badge>
                            <span>Same day processing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="stat">
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-red-100 text-red-800">STAT</Badge>
                            <span>Immediate processing</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_authorization">Insurance Authorization</Label>
                    <Input
                      id="insurance_authorization"
                      {...register('insurance_authorization')}
                      placeholder="Authorization number (if required)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Selection */}
            <Card className="bg-green-50/30 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <TestTube className="h-4 w-4" />
                  <span>Test Selection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="panels" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="panels">Standard Panels</TabsTrigger>
                    <TabsTrigger value="custom">Custom Allergens</TabsTrigger>
                  </TabsList>

                  <TabsContent value="panels" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {testPanels.map((panel) => (
                        <Card
                          key={panel.id}
                          className={`cursor-pointer transition-all ${
                            selectedPanels.includes(panel.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:border-gray-300'
                          }`}
                          onClick={() => handlePanelToggle(panel.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedPanels.includes(panel.id)}
                                    onChange={() => handlePanelToggle(panel.id)}
                                  />
                                  <h3 className="font-medium">{panel.name}</h3>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{panel.description}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {panel.allergens.length} allergens
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {panel.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {selectedPanels.length === 0 && (
                      <p className="text-sm text-destructive">At least one test panel is required</p>
                    )}
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {customAllergens.map((allergen) => (
                        <Card
                          key={allergen.id}
                          className={`cursor-pointer transition-all ${
                            selectedCustomAllergens.includes(allergen.id)
                              ? 'border-green-500 bg-green-50'
                              : 'hover:border-gray-300'
                          }`}
                          onClick={() => handleCustomAllergenToggle(allergen.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedCustomAllergens.includes(allergen.id)}
                                onChange={() => handleCustomAllergenToggle(allergen.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{allergen.name}</p>
                                <p className="text-xs text-gray-500">{allergen.concentration}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-gray-50/30 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('instructions')}
                  placeholder="Any special instructions for the testing procedure..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 text-base font-medium"
                size="lg"
              >
                <TestTube className="h-5 w-5 mr-2" />
                {loading ? 'Creating Order...' : 'Create Skin Test Order'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-11 text-base"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};