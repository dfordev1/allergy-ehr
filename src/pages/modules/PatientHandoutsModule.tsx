import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Mail, 
  Printer, 
  ArrowLeft,
  User,
  Calendar,
  Languages,
  Eye,
  Send
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface PatientHandout {
  id: string;
  patient_id: string;
  handout_type: string;
  title: string;
  content: string;
  allergens_mentioned: string[];
  language: string;
  generated_date: string;
  delivered_method?: string;
  status: string;
  patient?: {
    name: string;
    labno: string;
  };
}

const handoutTemplates = {
  allergy_education: {
    title: 'Understanding Your Allergies',
    content: `Dear {patient_name},

Based on your recent allergy testing, you have been diagnosed with allergies to the following substances:
{allergen_list}

What are allergies?
Allergies occur when your immune system reacts to substances that are normally harmless. These substances are called allergens.

Managing Your Allergies:
1. Avoid known allergens whenever possible
2. Keep rescue medications readily available
3. Wear medical alert identification
4. Inform healthcare providers about your allergies
5. Consider immunotherapy if recommended

Emergency Action:
If you experience severe allergic reactions (anaphylaxis), use your epinephrine auto-injector immediately and call 911.

Please contact our office if you have any questions about your allergies or treatment plan.

Sincerely,
Your Allergy Care Team`
  },
  avoidance_measures: {
    title: 'Allergen Avoidance Guidelines',
    content: `Dear {patient_name},

To help manage your allergies to {allergen_list}, please follow these avoidance measures:

Environmental Allergens:
• Use HEPA air filters in your home
• Keep windows closed during high pollen seasons
• Wash bedding in hot water weekly
• Use allergen-proof mattress and pillow covers
• Maintain low humidity levels (30-50%)

Food Allergens:
• Always read ingredient labels carefully
• Inform restaurants about your food allergies
• Carry emergency medications at all times
• Consider wearing medical alert jewelry

General Tips:
• Keep a diary of symptoms and exposures
• Plan ahead for travel and social events
• Educate family and friends about your allergies

Remember: Complete avoidance is the most effective treatment for allergies.

Contact us if you need clarification on any avoidance measures.

Best regards,
Your Allergy Care Team`
  },
  emergency_action: {
    title: 'Emergency Action Plan',
    content: `EMERGENCY ACTION PLAN FOR: {patient_name}
Date: {current_date}

ALLERGIES: {allergen_list}

MILD TO MODERATE REACTIONS:
Symptoms: Hives, itching, mild swelling, stomach upset
Actions:
1. Remove or avoid the allergen
2. Give antihistamine as prescribed
3. Monitor symptoms closely
4. Contact healthcare provider if symptoms worsen

SEVERE ALLERGIC REACTION (ANAPHYLAXIS):
Symptoms: Difficulty breathing, swelling of throat/tongue, rapid pulse, dizziness, severe whole-body reaction
Actions:
1. Call 911 immediately
2. Use epinephrine auto-injector right away
3. Lie down with legs elevated
4. Be prepared to give second dose of epinephrine if needed
5. Go to emergency room even if symptoms improve

MEDICATIONS:
• Epinephrine auto-injector: {epi_pen_info}
• Antihistamine: {antihistamine_info}
• Other: {other_medications}

EMERGENCY CONTACTS:
• Emergency Services: 911
• Allergist: {doctor_phone}
• Primary Care: {primary_care_phone}

Keep this plan with you at all times and ensure family, friends, and caregivers are familiar with it.`
  },
  immunotherapy_info: {
    title: 'Immunotherapy Treatment Information',
    content: `Dear {patient_name},

You are beginning allergen immunotherapy (allergy shots) treatment for your allergies to: {allergen_list}

What is Immunotherapy?
Immunotherapy involves giving you small, gradually increasing amounts of allergens to help your immune system become less sensitive to them.

Treatment Schedule:
• Build-up Phase: 1-2 visits per week for 3-6 months
• Maintenance Phase: Monthly visits for 3-5 years

Before Each Visit:
• Take your medications as prescribed
• Inform staff of any illness or medication changes
• Report any reactions from previous shots

After Each Shot:
• Wait in the office for 30 minutes
• Apply ice to injection site if needed
• Avoid vigorous exercise for 2 hours
• Report any concerning symptoms immediately

Possible Reactions:
• Local: Redness, swelling, itching at injection site
• Systemic: Sneezing, hives, breathing difficulties (rare but serious)

Contact Information:
• Office: {office_phone}
• After Hours: {emergency_phone}

Your commitment to the treatment schedule is essential for success. Please don't hesitate to ask questions about your treatment.

Sincerely,
Your Immunotherapy Team`
  }
};

export const PatientHandoutsModule = () => {
  const navigate = useNavigate();
  const [handouts, setHandouts] = useState<PatientHandout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      handout_type: '',
      patient_id: '',
      language: 'en',
      allergens_mentioned: '',
      custom_content: ''
    }
  });

  const selectedHandoutType = watch('handout_type');

  useEffect(() => {
    loadHandouts();
  }, []);

  const loadHandouts = async () => {
    setLoading(true);
    try {
      // This would load handouts from the API
      // For now, we'll use mock data
      setHandouts([]);
    } catch (error) {
      console.error('Error loading handouts:', error);
      toast.error('Failed to load handouts');
    } finally {
      setLoading(false);
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

  const generateHandout = async (data: any) => {
    try {
      const template = handoutTemplates[data.handout_type as keyof typeof handoutTemplates];
      if (!template) {
        toast.error('Invalid handout type selected');
        return;
      }

      const selectedPatientData = patients.find(p => p.id === data.patient_id);
      if (!selectedPatientData) {
        toast.error('Please select a valid patient');
        return;
      }

      // Replace placeholders in template
      let content = template.content;
      content = content.replace(/{patient_name}/g, selectedPatientData.name);
      content = content.replace(/{current_date}/g, new Date().toLocaleDateString());
      content = content.replace(/{allergen_list}/g, data.allergens_mentioned || 'Various allergens');

      const handoutData = {
        patient_id: data.patient_id,
        handout_type: data.handout_type,
        title: template.title,
        content: data.custom_content || content,
        allergens_mentioned: data.allergens_mentioned.split(',').map((a: string) => a.trim()),
        language: data.language,
        status: 'generated'
      };

      const result = await AllergyPracticeApiService.generatePatientHandout(handoutData);
      if (result.data) {
        toast.success('Patient handout generated successfully');
        setShowGenerateForm(false);
        reset();
        loadHandouts();
      }
    } catch (error) {
      console.error('Error generating handout:', error);
      toast.error('Failed to generate handout');
    }
  };

  const downloadHandout = (handout: PatientHandout) => {
    const element = document.createElement('a');
    const file = new Blob([handout.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${handout.title.replace(/\s+/g, '_')}_${handout.patient?.name?.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Handout downloaded successfully');
  };

  const previewHandout = (handout: PatientHandout) => {
    // Open preview modal or new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>${handout.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
              .header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${handout.title}</h1>
              <p><strong>Patient:</strong> ${handout.patient?.name || 'N/A'}</p>
              <p><strong>Generated:</strong> ${new Date(handout.generated_date).toLocaleDateString()}</p>
              <p><strong>Language:</strong> ${handout.language}</p>
            </div>
            <div style="white-space: pre-wrap;">${handout.content}</div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/practice')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-teal-600" />
                  <span>Patient Allergy Handouts</span>
                </h1>
                <p className="mt-1 text-gray-600">Generate personalized educational materials and care instructions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={loadHandouts}>
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowGenerateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Handout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600 font-medium">Total Handouts</p>
                    <p className="text-2xl font-bold text-teal-900">{handouts.length}</p>
                  </div>
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">This Month</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {handouts.filter(h => {
                        const handoutDate = new Date(h.generated_date);
                        const now = new Date();
                        return handoutDate.getMonth() === now.getMonth() && handoutDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Delivered</p>
                    <p className="text-2xl font-bold text-green-900">
                      {handouts.filter(h => h.status === 'delivered').length}
                    </p>
                  </div>
                  <Send className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Languages</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(handouts.map(h => h.language)).size || 1}
                    </p>
                  </div>
                  <Languages className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Handout Form */}
          {showGenerateForm && (
            <Card className="border-2 border-teal-200">
              <CardHeader>
                <CardTitle>Generate New Patient Handout</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(generateHandout)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="handout_type">Handout Type *</Label>
                      <select
                        id="handout_type"
                        {...register('handout_type', { required: 'Handout type is required' })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select handout type</option>
                        <option value="allergy_education">Allergy Education</option>
                        <option value="avoidance_measures">Avoidance Measures</option>
                        <option value="emergency_action">Emergency Action Plan</option>
                        <option value="immunotherapy_info">Immunotherapy Information</option>
                      </select>
                      {errors.handout_type && (
                        <p className="text-sm text-destructive">{errors.handout_type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        {...register('language')}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient_search">Search Patient *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="patient_search"
                        placeholder="Search by patient name or lab number..."
                        className="pl-9"
                        onChange={(e) => searchPatients(e.target.value)}
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
                              setSelectedPatient(`${patient.name} (${patient.labno})`);
                              setPatients([]);
                            }}
                          >
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-gray-500">Lab: {patient.labno}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedPatient && (
                      <div className="text-sm text-green-600">Selected: {selectedPatient}</div>
                    )}
                    {errors.patient_id && (
                      <p className="text-sm text-destructive">Patient selection is required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergens_mentioned">Allergens (comma-separated)</Label>
                    <Input
                      id="allergens_mentioned"
                      {...register('allergens_mentioned')}
                      placeholder="e.g., Dust mites, Cat dander, Pollen"
                    />
                  </div>

                  {selectedHandoutType && (
                    <div className="space-y-2">
                      <Label>Template Preview</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                        <h4 className="font-medium mb-2">
                          {handoutTemplates[selectedHandoutType as keyof typeof handoutTemplates]?.title}
                        </h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {handoutTemplates[selectedHandoutType as keyof typeof handoutTemplates]?.content.substring(0, 200)}...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="custom_content">Custom Content (optional)</Label>
                    <Textarea
                      id="custom_content"
                      {...register('custom_content')}
                      placeholder="Override template with custom content..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowGenerateForm(false);
                        reset();
                        setSelectedPatient('');
                        setPatients([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Generate Handout
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Handouts List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Handouts</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search handouts..."
                    className="pl-9 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading handouts...</div>
                </div>
              ) : handouts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Handouts Generated</h3>
                  <p className="text-gray-600 mb-4">
                    Start by generating your first patient handout to provide personalized care instructions.
                  </p>
                  <Button onClick={() => setShowGenerateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate First Handout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {handouts.map((handout) => (
                    <Card key={handout.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{handout.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {handout.handout_type.replace('_', ' ')}
                              </Badge>
                              <Badge className={
                                handout.status === 'delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }>
                                {handout.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>{handout.patient?.name || 'Unknown Patient'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(handout.generated_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Languages className="h-4 w-4" />
                                <span>{handout.language.toUpperCase()}</span>
                              </div>
                            </div>

                            {handout.allergens_mentioned.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {handout.allergens_mentioned.map((allergen, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {allergen}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => previewHandout(handout)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadHandout(handout)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                            <Button size="sm" variant="outline">
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};