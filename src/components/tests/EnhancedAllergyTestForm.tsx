import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestTube, User, Calendar, Save, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const enhancedTestSchema = z.object({
  patient_info: z.object({
    name: z.string().min(1, 'Patient name is required'),
    lab_no: z.string().min(1, 'Lab number is required'),
    age_sex: z.string().optional(),
    provisional_diagnosis: z.string().optional(),
    mrd: z.string().optional(),
    test_date: z.string().min(1, 'Test date is required'),
    referred_by: z.string().optional(),
  }),
  allergens: z.array(z.object({
    sno: z.number(),
    category: z.string(),
    name: z.string(),
    wheal_size_mm: z.string().optional(),
    test_result: z.string().optional(),
  })),
  controls: z.object({
    positive_control_histamine: z.string().optional(),
    negative_control_saline: z.string().optional(),
  }),
  technician: z.string().optional(),
  notes: z.string().optional(),
});

type EnhancedTestFormData = z.infer<typeof enhancedTestSchema>;

interface EnhancedAllergyTestFormProps {
  patientId: string;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Predefined allergens data matching the JSON format
const PREDEFINED_ALLERGENS = [
  // MITE
  { sno: 1, category: "MITE", name: "D. farinae" },
  { sno: 2, category: "MITE", name: "D. pteronyssinus" },
  { sno: 3, category: "MITE", name: "Blomia sp." },
  
  // POLLENS
  { sno: 4, category: "POLLENS", name: "Cyanodon dactylon" },
  { sno: 5, category: "POLLENS", name: "Cenchrus barbatus" },
  { sno: 6, category: "POLLENS", name: "Zea mays" },
  { sno: 7, category: "POLLENS", name: "Rye Grass" },
  { sno: 8, category: "POLLENS", name: "Meadow fescue/E. Plantain" },
  { sno: 9, category: "POLLENS", name: "Kentucky Blue Grass" },
  { sno: 10, category: "POLLENS", name: "Timothy Grass" },
  { sno: 11, category: "POLLENS", name: "Cyperus rotundus" },
  { sno: 12, category: "POLLENS", name: "Typha angustata" },
  { sno: 13, category: "POLLENS", name: "Short Ragweed" },
  { sno: 14, category: "POLLENS", name: "P. hysterophorus" },
  { sno: 15, category: "POLLENS", name: "Amaranthus spinosus" },
  { sno: 16, category: "POLLENS", name: "Chenopodium alba" },
  { sno: 17, category: "POLLENS", name: "Mugwort" },
  { sno: 18, category: "POLLENS", name: "Ricinus communis" },
  { sno: 19, category: "POLLENS", name: "Brassica nigra" },
  { sno: 20, category: "POLLENS", name: "Mustard / Russian Thistle" },
  { sno: 21, category: "POLLENS", name: "Cannabis sativa" },
  { sno: 22, category: "POLLENS", name: "Nettle" },
  { sno: 23, category: "POLLENS", name: "Acacia arabica" },
  { sno: 24, category: "POLLENS", name: "Prosopis juliflora" },
  { sno: 25, category: "POLLENS", name: "Birch / Robinia" },
  
  // TREES
  { sno: 26, category: "TREES", name: "Poplar / Eucalyptus" },
  
  // FUNGI
  { sno: 27, category: "FUNGI", name: "Aspergillus fumigatus" },
  { sno: 28, category: "FUNGI", name: "Aspergillus niger" },
  { sno: 29, category: "FUNGI", name: "Alternaria alternata" },
  
  // DUST MIX
  { sno: 30, category: "DUST MIX", name: "House Dust" },
  { sno: 31, category: "DUST MIX", name: "Saw Dust (Wood)" },
  { sno: 32, category: "DUST MIX", name: "Grain Dust (Rice)" },
  { sno: 33, category: "DUST MIX", name: "Grain Dust (Wheat)" },
  { sno: 34, category: "DUST MIX", name: "Hay Dust" },
  
  // EPITHELIA
  { sno: 35, category: "EPITHELIA", name: "Cat Epithelia" },
  { sno: 36, category: "EPITHELIA", name: "Dog Epithelia" },
  { sno: 37, category: "EPITHELIA", name: "Chicken Feather" },
  { sno: 38, category: "EPITHELIA", name: "Sheep's Wool" },
  
  // INSECTS
  { sno: 39, category: "INSECTS", name: "Cockroach" },
  { sno: 40, category: "INSECTS", name: "Honey Bee" },
  { sno: 41, category: "INSECTS", name: "Red Ant" },
  { sno: 42, category: "INSECTS", name: "Mosquito" },
  { sno: 43, category: "INSECTS", name: "Wasp" }
];

const CATEGORIES = ["MITE", "POLLENS", "TREES", "FUNGI", "DUST MIX", "EPITHELIA", "INSECTS"];

export const EnhancedAllergyTestForm = ({ 
  patientId, 
  patientName, 
  onSuccess, 
  onCancel 
}: EnhancedAllergyTestFormProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allergenResults, setAllergenResults] = useState<{[key: number]: {wheal_size_mm: string, test_result: string}}>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnhancedTestFormData>({
    resolver: zodResolver(enhancedTestSchema),
    defaultValues: {
      patient_info: {
        name: patientName,
        lab_no: '',
        age_sex: '',
        provisional_diagnosis: '',
        mrd: '',
        test_date: new Date().toISOString().split('T')[0],
        referred_by: '',
      },
      allergens: PREDEFINED_ALLERGENS,
      controls: {
        positive_control_histamine: '',
        negative_control_saline: '',
      },
      technician: '',
      notes: '',
    },
  });

  const getFilteredAllergens = () => {
    if (selectedCategory === 'all') {
      return PREDEFINED_ALLERGENS;
    }
    return PREDEFINED_ALLERGENS.filter(allergen => allergen.category === selectedCategory);
  };

  const handleAllergenResultChange = (sno: number, field: 'wheal_size_mm' | 'test_result', value: string) => {
    setAllergenResults(prev => ({
      ...prev,
      [sno]: {
        wheal_size_mm: '',
        test_result: '',
        ...prev[sno],
        [field]: value
      }
    }));
  };

  const exportToPDF = () => {
    const patientInfo = {
      name: document.querySelector<HTMLInputElement>('input[name="patient_info.name"]')?.value || '',
      lab_no: document.querySelector<HTMLInputElement>('input[name="patient_info.lab_no"]')?.value || '',
      age_sex: document.querySelector<HTMLInputElement>('input[name="patient_info.age_sex"]')?.value || '',
      provisional_diagnosis: document.querySelector<HTMLInputElement>('input[name="patient_info.provisional_diagnosis"]')?.value || '',
      mrd: document.querySelector<HTMLInputElement>('input[name="patient_info.mrd"]')?.value || '',
              test_date: document.querySelector<HTMLInputElement>('input[name="patient_info.test_date"]')?.value || '',
      referred_by: document.querySelector<HTMLInputElement>('input[name="patient_info.referred_by"]')?.value || '',
    };

    const controls = {
      positive_control_histamine: document.querySelector<HTMLInputElement>('input[name="controls.positive_control_histamine"]')?.value || '',
      negative_control_saline: document.querySelector<HTMLInputElement>('input[name="controls.negative_control_saline"]')?.value || '',
    };

    // Generate PDF content
    const pdfContent = generatePDFContent(patientInfo, allergenResults, controls);
    
    // Create and download PDF
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allergy-test-${patientInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Allergy test report exported successfully!');
  };

  const generatePDFContent = (patientInfo: any, results: any, controls: any) => {
    const allergensByCategory = CATEGORIES.map(category => ({
      category,
      allergens: PREDEFINED_ALLERGENS.filter(a => a.category === category).map(allergen => ({
        ...allergen,
        result: results[allergen.sno] || { wheal_size_mm: '', test_result: '' }
      }))
    }));

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Allergy Test Report - ${patientInfo.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .patient-info { margin-bottom: 20px; }
        .patient-info table { width: 100%; border-collapse: collapse; }
        .patient-info td { padding: 5px; border: 1px solid #ddd; }
        .controls { margin: 20px 0; }
        .category { margin: 20px 0; }
        .category h3 { background: #f0f0f0; padding: 10px; margin: 0; }
        .allergen-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .allergen-table th, .allergen-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .allergen-table th { background-color: #f2f2f2; }
        .positive { background-color: #ffebee; }
        .negative { background-color: #e8f5e8; }
        .equivocal { background-color: #fff3e0; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Enhanced Allergy Test Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="patient-info">
        <h2>Patient Information</h2>
        <table>
            <tr><td><strong>Name:</strong></td><td>${patientInfo.name}</td><td><strong>Lab No:</strong></td><td>${patientInfo.lab_no}</td></tr>
            <tr><td><strong>Age/Sex:</strong></td><td>${patientInfo.age_sex}</td><td><strong>MRD:</strong></td><td>${patientInfo.mrd}</td></tr>
            <tr><td><strong>Date of Testing:</strong></td><td>${patientInfo.test_date}</td><td><strong>Referred By:</strong></td><td>${patientInfo.referred_by}</td></tr>
            <tr><td colspan="4"><strong>Provisional Diagnosis:</strong> ${patientInfo.provisional_diagnosis}</td></tr>
        </table>
    </div>

    <div class="controls">
        <h2>Controls</h2>
        <table style="width: 50%;">
            <tr><td><strong>Positive Control (Histamine):</strong></td><td>${controls.positive_control_histamine} mm</td></tr>
            <tr><td><strong>Negative Control (Saline):</strong></td><td>${controls.negative_control_saline} mm</td></tr>
        </table>
    </div>

    <div class="results">
        <h2>Test Results</h2>
        ${allergensByCategory.map(cat => `
            <div class="category">
                <h3>${cat.category}</h3>
                <table class="allergen-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Allergen</th>
                            <th>Wheal Size (mm)</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cat.allergens.map(allergen => `
                            <tr class="${allergen.result.test_result}">
                                <td>${allergen.sno}</td>
                                <td>${allergen.name}</td>
                                <td>${allergen.result.wheal_size_mm}</td>
                                <td>${allergen.result.test_result || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  };

  const onSubmit = async (data: EnhancedTestFormData) => {
    setLoading(true);
    try {
                   // Process allergens with results - convert to object format for database
      const allergenResultsObject: {[key: string]: string} = {};
      
      PREDEFINED_ALLERGENS.forEach(allergen => {
        const result = allergenResults[allergen.sno] || { wheal_size_mm: '', test_result: '' };
        
        // Only include allergens that have results
        if (result.wheal_size_mm || result.test_result) {
          const whealSize = result.wheal_size_mm || '0';
          const testResult = result.test_result && result.test_result !== 'none' ? result.test_result : '';
          
          // Use wheal size in mm as the value (matching existing data format like "3mm", "5mm")
          if (whealSize && whealSize !== '0') {
            allergenResultsObject[allergen.name.toLowerCase().replace(/\s+/g, '_')] = `${whealSize}mm`;
          }
        }
      });

            // Insert the test data with correct allergen_results format
      const { error } = await supabase
        .from('enhanced_allergy_tests')
        .insert({
          patient_id: patientId,
          test_date: data.patient_info.test_date,
          patient_info: {
            name: data.patient_info.name,
            lab_no: data.patient_info.lab_no,
            age_sex: data.patient_info.age_sex,
            provisional_diagnosis: data.patient_info.provisional_diagnosis,
            mrd: data.patient_info.mrd,
            referred_by: data.patient_info.referred_by
          },
          allergen_results: allergenResultsObject,
          controls: data.controls,
          interpretation: data.notes || '',
          recommendations: '',
          is_completed: true
        });

       /* 
       // Uncomment this when enhanced_allergy_tests table is created
       const { error } = await supabase
        .from('enhanced_allergy_tests')
        .insert({
          patient_id: patientId,
          patient_name: data.patient_info.name,
          lab_no: data.patient_info.lab_no,
          age_sex: data.patient_info.age_sex,
          provisional_diagnosis: data.patient_info.provisional_diagnosis,
          mrd: data.patient_info.mrd,
          test_date: data.patient_info.test_date,
          referred_by: data.patient_info.referred_by,
          test_results: processedAllergens,
          controls: data.controls,
          technician: data.technician,
          notes: data.notes,
          test_status: 'completed',
        });
        */

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error saving allergy test: ' + error.message);
        return;
      }

      toast.success('Allergy test saved successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error saving allergy test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Enhanced Allergy Test Form</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {PREDEFINED_ALLERGENS.length} Allergens
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="patient_name">Patient Name</Label>
                <Input
                  id="patient_name"
                  {...register('patient_info.name')}
                  placeholder="Patient name"
                />
                {errors.patient_info?.name && (
                  <p className="text-sm text-destructive">{errors.patient_info.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lab_no">Lab Number</Label>
                <Input
                  id="lab_no"
                  {...register('patient_info.lab_no')}
                  placeholder="Lab number"
                />
                {errors.patient_info?.lab_no && (
                  <p className="text-sm text-destructive">{errors.patient_info.lab_no.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_sex">Age/Sex</Label>
                <Input
                  id="age_sex"
                  {...register('patient_info.age_sex')}
                  placeholder="e.g., 25/M"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provisional_diagnosis">Provisional Diagnosis</Label>
                <Input
                  id="provisional_diagnosis"
                  {...register('patient_info.provisional_diagnosis')}
                  placeholder="Provisional diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mrd">MRD</Label>
                <Input
                  id="mrd"
                  {...register('patient_info.mrd')}
                  placeholder="MRD"
                />
              </div>

              <div className="space-y-2">
                            <Label htmlFor="test_date">Date of Testing</Label>
            <Input
              id="test_date"
              type="date"
              {...register('patient_info.test_date')}
            />
            {errors.patient_info?.test_date && (
              <p className="text-sm text-destructive">{errors.patient_info.test_date.message}</p>
            )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referred_by">Referred By</Label>
                <Input
                  id="referred_by"
                  {...register('patient_info.referred_by')}
                  placeholder="Referring physician"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technician">Technician</Label>
                <Input
                  id="technician"
                  {...register('technician')}
                  placeholder="Technician name"
                />
              </div>
            </div>

            {/* Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="positive_control">Positive Control (Histamine)</Label>
                    <Input
                      id="positive_control"
                      {...register('controls.positive_control_histamine')}
                      placeholder="Wheal size in mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="negative_control">Negative Control (Saline)</Label>
                    <Input
                      id="negative_control"
                      {...register('controls.negative_control_saline')}
                      placeholder="Wheal size in mm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergens */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Allergen Test Results</CardTitle>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
                            <CardContent>
                {/* Compact Table Layout */}
                <div className="max-h-80 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">S.No</th>
                        <th className="p-2 text-left">Category</th>
                        <th className="p-2 text-left">Allergen</th>
                        <th className="p-2 text-left">Wheal Size (mm)</th>
                        <th className="p-2 text-left">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAllergens().map((allergen) => {
                        const result = allergenResults[allergen.sno] || { wheal_size_mm: '', test_result: '' };
                        
                        return (
                          <tr key={allergen.sno} className="border-b hover:bg-muted/30">
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {allergen.sno}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="secondary" className="text-xs">
                                {allergen.category}
                              </Badge>
                            </td>
                            <td className="p-2 font-medium">{allergen.name}</td>
                            <td className="p-2">
                              <Input
                                value={result.wheal_size_mm}
                                onChange={(e) => handleAllergenResultChange(allergen.sno, 'wheal_size_mm', e.target.value)}
                                placeholder="mm"
                                className="w-16 h-8 text-center"
                              />
                            </td>
                            <td className="p-2">
                              <Select
                                value={result.test_result || 'none'}
                                onValueChange={(value) => handleAllergenResultChange(allergen.sno, 'test_result', value)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">-</SelectItem>
                                  <SelectItem value="positive">+</SelectItem>
                                  <SelectItem value="negative">-</SelectItem>
                                  <SelectItem value="equivocal">±</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes or observations..."
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Test'}
              </Button>
              <Button type="button" onClick={exportToPDF} variant="secondary" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 