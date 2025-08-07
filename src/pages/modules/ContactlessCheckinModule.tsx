import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Smartphone, 
  Plus, 
  Search, 
  QrCode, 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Shield,
  RefreshCw
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface ContactlessCheckin {
  id: string;
  patient_id: string;
  appointment_date: string;
  check_in_time: string;
  check_in_method: string;
  symptoms_questionnaire: {
    asthma_symptoms: boolean;
    allergy_symptoms: boolean;
    new_medications: boolean;
    recent_illness: boolean;
    covid_screening: {
      fever: boolean;
      cough: boolean;
      shortness_of_breath: boolean;
      loss_of_taste_smell: boolean;
      close_contact_positive: boolean;
      recent_travel: boolean;
      cleared_for_visit: boolean;
    };
    additional_concerns?: string;
  };
  insurance_verified: boolean;
  copay_collected: boolean;
  status: string;
  patient?: {
    name: string;
    labno: string;
  };
}

export const ContactlessCheckinModule = () => {
  const navigate = useNavigate();
  const [checkins, setCheckins] = useState<ContactlessCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      patient_id: '',
      appointment_date: new Date().toISOString().split('T')[0],
      check_in_method: 'app',
      symptoms_questionnaire: {
        asthma_symptoms: false,
        allergy_symptoms: false,
        new_medications: false,
        recent_illness: false,
        covid_screening: {
          fever: false,
          cough: false,
          shortness_of_breath: false,
          loss_of_taste_smell: false,
          close_contact_positive: false,
          recent_travel: false,
          cleared_for_visit: true
        },
        additional_concerns: ''
      },
      insurance_verified: false,
      copay_collected: false
    }
  });

  useEffect(() => {
    loadTodaysCheckins();
  }, []);

  const loadTodaysCheckins = async () => {
    setLoading(true);
    try {
      const result = await AllergyPracticeApiService.getTodaysCheckins();
      if (result.data) {
        setCheckins(result.data);
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
      toast.error('Failed to load check-ins');
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

  const processCheckin = async (data: any) => {
    try {
      const checkinData = {
        ...data,
        status: 'checked_in'
      };

      const result = await AllergyPracticeApiService.createContactlessCheckin(checkinData);
      if (result.data) {
        toast.success('Patient checked in successfully');
        setShowCheckinForm(false);
        reset();
        setSelectedPatient('');
        loadTodaysCheckins();
      }
    } catch (error) {
      console.error('Error processing check-in:', error);
      toast.error('Failed to process check-in');
    }
  };

  const updateCheckinStatus = async (checkinId: string, newStatus: string) => {
    try {
      // This would update the check-in status via API
      toast.success(`Check-in status updated to ${newStatus}`);
      loadTodaysCheckins();
    } catch (error) {
      console.error('Error updating check-in status:', error);
      toast.error('Failed to update check-in status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_provider': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCheckins = checkins.filter(checkin => {
    const matchesSearch = checkin.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checkin.patient?.labno?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || checkin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const checkinStats = {
    total: checkins.length,
    checked_in: checkins.filter(c => c.status === 'checked_in').length,
    ready: checkins.filter(c => c.status === 'ready_for_provider').length,
    in_progress: checkins.filter(c => c.status === 'in_progress').length,
    completed: checkins.filter(c => c.status === 'completed').length,
  };

  const covidScreeningFailed = (checkin: ContactlessCheckin) => {
    const covid = checkin.symptoms_questionnaire.covid_screening;
    return covid.fever || covid.cough || covid.shortness_of_breath || 
           covid.loss_of_taste_smell || covid.close_contact_positive;
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
                  <Smartphone className="h-8 w-8 text-green-600" />
                  <span>Contactless Check-in</span>
                </h1>
                <p className="mt-1 text-gray-600">Digital patient check-in with symptom screening</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={loadTodaysCheckins}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowCheckinForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Check-in
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Today</p>
                    <p className="text-2xl font-bold text-green-900">{checkinStats.total}</p>
                  </div>
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Checked In</p>
                    <p className="text-2xl font-bold text-blue-900">{checkinStats.checked_in}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Ready</p>
                    <p className="text-2xl font-bold text-purple-900">{checkinStats.ready}</p>
                  </div>
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">In Progress</p>
                    <p className="text-2xl font-bold text-orange-900">{checkinStats.in_progress}</p>
                  </div>
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{checkinStats.completed}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Generator */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <QrCode className="h-12 w-12 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Patient Check-in QR Code</h3>
                    <p className="text-gray-600">Patients can scan this code to start contactless check-in</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline">
                    Generate QR Code
                  </Button>
                  <Button variant="outline">
                    Print Signs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Check-in Form */}
          {showCheckinForm && (
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle>Manual Patient Check-in</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(processCheckin)} className="space-y-6">
                  {/* Patient Selection */}
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
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointment_date">Appointment Date</Label>
                      <Input
                        id="appointment_date"
                        type="date"
                        {...register('appointment_date')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_in_method">Check-in Method</Label>
                      <select
                        id="check_in_method"
                        {...register('check_in_method')}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="app">Mobile App</option>
                        <option value="qr_code">QR Code</option>
                        <option value="text_message">Text Message</option>
                      </select>
                    </div>
                  </div>

                  {/* Symptom Questionnaire */}
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Symptom Questionnaire</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.asthma_symptoms')}
                            />
                            <Label>Asthma symptoms today?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.allergy_symptoms')}
                            />
                            <Label>Allergy symptoms today?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.new_medications')}
                            />
                            <Label>Started new medications?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.recent_illness')}
                            />
                            <Label>Recent illness or infection?</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* COVID-19 Screening */}
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <span>COVID-19 Screening</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.fever')}
                            />
                            <Label>Fever (100.4°F or higher)?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.cough')}
                            />
                            <Label>New or worsening cough?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.shortness_of_breath')}
                            />
                            <Label>Shortness of breath?</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.loss_of_taste_smell')}
                            />
                            <Label>Loss of taste or smell?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.close_contact_positive')}
                            />
                            <Label>Close contact with COVID-19 positive?</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register('symptoms_questionnaire.covid_screening.recent_travel')}
                            />
                            <Label>Recent travel to high-risk areas?</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="additional_concerns">Additional Concerns</Label>
                      <Textarea
                        id="additional_concerns"
                        {...register('symptoms_questionnaire.additional_concerns')}
                        placeholder="Any other symptoms or concerns..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          {...register('insurance_verified')}
                        />
                        <Label>Insurance verified</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          {...register('copay_collected')}
                        />
                        <Label>Copay collected</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCheckinForm(false);
                        reset();
                        setSelectedPatient('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Complete Check-in
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search check-ins..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="checked_in">Checked In</option>
                  <option value="ready_for_provider">Ready for Provider</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Check-ins List */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-lg">Loading check-ins...</div>
                </div>
              ) : filteredCheckins.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Check-ins Today</h3>
                  <p className="text-gray-600 mb-4">
                    Patients will appear here once they complete contactless check-in.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCheckins.map((checkin) => (
                    <Card key={checkin.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {checkin.patient?.name || 'Unknown Patient'}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {checkin.patient?.labno || 'N/A'}
                              </Badge>
                              <Badge className={getStatusColor(checkin.status)}>
                                {checkin.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {covidScreeningFailed(checkin) && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  COVID Alert
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Checked in: {new Date(checkin.check_in_time).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Smartphone className="h-4 w-4" />
                                <span>Method: {checkin.check_in_method.replace('_', ' ')}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4" />
                                <span>Insurance: {checkin.insurance_verified ? 'Verified' : 'Pending'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4" />
                                <span>Copay: {checkin.copay_collected ? 'Collected' : 'Pending'}</span>
                              </div>
                            </div>

                            {/* Symptom Summary */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <h4 className="font-medium text-gray-900 mb-2">Symptom Summary</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div className={`flex items-center space-x-1 ${checkin.symptoms_questionnaire.asthma_symptoms ? 'text-orange-600' : 'text-green-600'}`}>
                                  <span>Asthma: {checkin.symptoms_questionnaire.asthma_symptoms ? 'Yes' : 'No'}</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${checkin.symptoms_questionnaire.allergy_symptoms ? 'text-orange-600' : 'text-green-600'}`}>
                                  <span>Allergies: {checkin.symptoms_questionnaire.allergy_symptoms ? 'Yes' : 'No'}</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${checkin.symptoms_questionnaire.new_medications ? 'text-orange-600' : 'text-green-600'}`}>
                                  <span>New Meds: {checkin.symptoms_questionnaire.new_medications ? 'Yes' : 'No'}</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${covidScreeningFailed(checkin) ? 'text-red-600' : 'text-green-600'}`}>
                                  <span>COVID Clear: {covidScreeningFailed(checkin) ? 'No' : 'Yes'}</span>
                                </div>
                              </div>
                              {checkin.symptoms_questionnaire.additional_concerns && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded border">
                                  <p className="text-sm text-gray-700">
                                    <strong>Additional Concerns:</strong> {checkin.symptoms_questionnaire.additional_concerns}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {checkin.status === 'checked_in' && (
                              <Button 
                                size="sm"
                                onClick={() => updateCheckinStatus(checkin.id, 'ready_for_provider')}
                                disabled={covidScreeningFailed(checkin)}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {checkin.status === 'ready_for_provider' && (
                              <Button 
                                size="sm"
                                onClick={() => updateCheckinStatus(checkin.id, 'in_progress')}
                              >
                                Start Visit
                              </Button>
                            )}
                            {checkin.status === 'in_progress' && (
                              <Button 
                                size="sm"
                                onClick={() => updateCheckinStatus(checkin.id, 'completed')}
                              >
                                Complete Visit
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
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