import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ArrowLeft,
  TestTube,
  Package,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AllergyPracticeApiService } from '@/services/allergyPracticeApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface CustomAllergen {
  id: string;
  name: string;
  category: string;
  source?: string;
  concentration: string;
  manufacturer?: string;
  lot_number?: string;
  expiration_date?: string;
  storage_requirements?: string;
  active: boolean;
}

interface TestPanel {
  id: string;
  name: string;
  description?: string;
  allergens: string[];
  category: string;
  active: boolean;
}

export const CustomAllergensModule = () => {
  const navigate = useNavigate();
  const [allergens, setAllergens] = useState<CustomAllergen[]>([]);
  const [panels, setPanels] = useState<TestPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllergenForm, setShowAllergenForm] = useState(false);
  const [showPanelForm, setShowPanelForm] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState<CustomAllergen | null>(null);
  const [editingPanel, setEditingPanel] = useState<TestPanel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { register: registerAllergen, handleSubmit: handleAllergenSubmit, reset: resetAllergen, formState: { errors: allergenErrors } } = useForm();
  const { register: registerPanel, handleSubmit: handlePanelSubmit, reset: resetPanel, formState: { errors: panelErrors } } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allergensResult, panelsResult] = await Promise.all([
        AllergyPracticeApiService.getCustomAllergens(),
        AllergyPracticeApiService.getSkinTestPanels()
      ]);

      if (allergensResult.data) setAllergens(allergensResult.data);
      if (panelsResult.data) setPanels(panelsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load allergens and panels');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAllergen = async (data: any) => {
    try {
      const allergenData = {
        ...data,
        active: true,
        created_by: 'current-user' // Replace with actual user ID
      };

      if (editingAllergen) {
        // Update logic would go here
        toast.success('Allergen updated successfully');
      } else {
        await AllergyPracticeApiService.createCustomAllergen(allergenData);
        toast.success('Custom allergen created successfully');
      }

      setShowAllergenForm(false);
      setEditingAllergen(null);
      resetAllergen();
      loadData();
    } catch (error) {
      console.error('Error saving allergen:', error);
      toast.error('Failed to save allergen');
    }
  };

  const onSubmitPanel = async (data: any) => {
    try {
      const panelData = {
        ...data,
        allergens: selectedAllergens,
        active: true,
        created_by: 'current-user' // Replace with actual user ID
      };

      if (editingPanel) {
        // Update logic would go here
        toast.success('Panel updated successfully');
      } else {
        await AllergyPracticeApiService.createSkinTestPanel(panelData);
        toast.success('Test panel created successfully');
      }

      setShowPanelForm(false);
      setEditingPanel(null);
      resetPanel();
      setSelectedAllergens([]);
      loadData();
    } catch (error) {
      console.error('Error saving panel:', error);
      toast.error('Failed to save panel');
    }
  };

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const handleAllergenToggle = (allergenId: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergenId) 
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const filteredAllergens = allergens.filter(allergen => {
    const matchesSearch = allergen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allergen.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || allergen.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Environmental', 'Food', 'Drug', 'Occupational', 'Custom'];

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
                  <Settings className="h-8 w-8 text-purple-600" />
                  <span>Custom Allergens & Panels</span>
                </h1>
                <p className="mt-1 text-gray-600">Manage custom allergens and create specialized testing panels</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Allergens</p>
                    <p className="text-2xl font-bold text-purple-900">{allergens.length}</p>
                  </div>
                  <TestTube className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Test Panels</p>
                    <p className="text-2xl font-bold text-blue-900">{panels.length}</p>
                  </div>
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-900">
                      {allergens.filter(a => a.active).length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {allergens.filter(a => {
                        if (!a.expiration_date) return false;
                        const expDate = new Date(a.expiration_date);
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                        return expDate <= thirtyDaysFromNow;
                      }).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="allergens" className="space-y-6">
            <TabsList>
              <TabsTrigger value="allergens">Custom Allergens</TabsTrigger>
              <TabsTrigger value="panels">Test Panels</TabsTrigger>
            </TabsList>

            {/* Custom Allergens Tab */}
            <TabsContent value="allergens" className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search allergens..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button onClick={() => setShowAllergenForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allergen
                </Button>
              </div>

              {showAllergenForm && (
                <Card className="border-2 border-purple-200">
                  <CardHeader>
                    <CardTitle>
                      {editingAllergen ? 'Edit Custom Allergen' : 'Add New Custom Allergen'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAllergenSubmit(onSubmitAllergen)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Allergen Name *</Label>
                          <Input
                            id="name"
                            {...registerAllergen('name', { required: 'Allergen name is required' })}
                            placeholder="e.g., House Dust Mite Mix"
                          />
                          {allergenErrors.name && (
                            <p className="text-sm text-destructive">{allergenErrors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <select
                            id="category"
                            {...registerAllergen('category', { required: 'Category is required' })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          {allergenErrors.category && (
                            <p className="text-sm text-destructive">{allergenErrors.category.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="concentration">Concentration *</Label>
                          <Input
                            id="concentration"
                            {...registerAllergen('concentration', { required: 'Concentration is required' })}
                            placeholder="e.g., 10,000 AU/mL"
                          />
                          {allergenErrors.concentration && (
                            <p className="text-sm text-destructive">{allergenErrors.concentration.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="manufacturer">Manufacturer</Label>
                          <Input
                            id="manufacturer"
                            {...registerAllergen('manufacturer')}
                            placeholder="e.g., ALK-Abello"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lot_number">Lot Number</Label>
                          <Input
                            id="lot_number"
                            {...registerAllergen('lot_number')}
                            placeholder="e.g., LOT123456"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expiration_date">Expiration Date</Label>
                          <Input
                            id="expiration_date"
                            type="date"
                            {...registerAllergen('expiration_date')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storage_requirements">Storage Requirements</Label>
                        <Textarea
                          id="storage_requirements"
                          {...registerAllergen('storage_requirements')}
                          placeholder="e.g., Store at 2-8°C, protect from light"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAllergenForm(false);
                            setEditingAllergen(null);
                            resetAllergen();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingAllergen ? 'Update Allergen' : 'Create Allergen'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAllergens.map((allergen) => (
                  <Card key={allergen.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{allergen.name}</h3>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Category:</span>
                          <Badge variant="secondary">{allergen.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Concentration:</span>
                          <span className="font-medium">{allergen.concentration}</span>
                        </div>
                        {allergen.manufacturer && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Manufacturer:</span>
                            <span className="font-medium">{allergen.manufacturer}</span>
                          </div>
                        )}
                        {allergen.expiration_date && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Expires:</span>
                            <span className={`font-medium ${
                              new Date(allergen.expiration_date) <= new Date(Date.now() + 30*24*60*60*1000)
                                ? 'text-orange-600' : 'text-gray-900'
                            }`}>
                              {new Date(allergen.expiration_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <Badge className={allergen.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {allergen.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Test Panels Tab */}
            <TabsContent value="panels" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Test Panels</h2>
                <Button onClick={() => setShowPanelForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Panel
                </Button>
              </div>

              {showPanelForm && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle>
                      {editingPanel ? 'Edit Test Panel' : 'Create New Test Panel'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePanelSubmit(onSubmitPanel)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="panel_name">Panel Name *</Label>
                          <Input
                            id="panel_name"
                            {...registerPanel('name', { required: 'Panel name is required' })}
                            placeholder="e.g., Environmental Standard Panel"
                          />
                          {panelErrors.name && (
                            <p className="text-sm text-destructive">{panelErrors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="panel_category">Category *</Label>
                          <select
                            id="panel_category"
                            {...registerPanel('category', { required: 'Category is required' })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="">Select category</option>
                            <option value="environmental">Environmental</option>
                            <option value="food">Food</option>
                            <option value="drug">Drug</option>
                            <option value="occupational">Occupational</option>
                            <option value="custom">Custom</option>
                          </select>
                          {panelErrors.category && (
                            <p className="text-sm text-destructive">{panelErrors.category.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="panel_description">Description</Label>
                        <Textarea
                          id="panel_description"
                          {...registerPanel('description')}
                          placeholder="Describe the purpose and scope of this test panel"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Select Allergens for Panel</Label>
                        <div className="max-h-60 overflow-y-auto border rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {allergens.filter(a => a.active).map((allergen) => (
                              <div key={allergen.id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedAllergens.includes(allergen.id)}
                                  onCheckedChange={() => handleAllergenToggle(allergen.id)}
                                />
                                <span className="text-sm">{allergen.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {allergen.category}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedAllergens.length} allergens selected
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPanelForm(false);
                            setEditingPanel(null);
                            resetPanel();
                            setSelectedAllergens([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={selectedAllergens.length === 0}>
                          {editingPanel ? 'Update Panel' : 'Create Panel'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {panels.map((panel) => (
                  <Card key={panel.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{panel.name}</h3>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {panel.description && (
                        <p className="text-sm text-gray-600 mb-3">{panel.description}</p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Category:</span>
                          <Badge variant="secondary">{panel.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Allergens:</span>
                          <span className="font-medium">{panel.allergens.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <Badge className={panel.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {panel.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};