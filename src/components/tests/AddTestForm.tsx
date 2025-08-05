import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const testSchema = z.object({
  testdate: z.string().min(1, 'Test date is required'),
  technician: z.string().min(1, 'Technician name is required'),
  notes: z.string().optional(),
  allergens: z.array(
    z.object({
      name: z.string().min(1, 'Allergen name is required'),
      wheal_size: z.number().min(0, 'Wheal size must be positive'),
    })
  ).min(1, 'At least one allergen is required'),
  controls: z.array(
    z.object({
      type: z.enum(['positive', 'negative']),
      wheal_size: z.number().min(0, 'Wheal size must be positive'),
    })
  ),
});

type TestFormData = z.infer<typeof testSchema>;

interface AddTestFormProps {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTestForm = ({ patientId, onSuccess, onCancel }: AddTestFormProps) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      allergens: [{ name: '', wheal_size: 0 }],
      controls: [
        { type: 'positive', wheal_size: 0 },
        { type: 'negative', wheal_size: 0 },
      ],
    },
  });

  const { fields: allergenFields, append: appendAllergen, remove: removeAllergen } = useFieldArray({
    control,
    name: 'allergens',
  });

  const { fields: controlFields } = useFieldArray({
    control,
    name: 'controls',
  });

  const watchedAllergens = watch('allergens');

  const isPositive = (whealSize: number) => whealSize > 3;

  const onSubmit = async (data: TestFormData) => {
    setLoading(true);
    try {
      const results = data.allergens.map(allergen => ({
        allergen: allergen.name,
        wheal_size: allergen.wheal_size,
        is_positive: isPositive(allergen.wheal_size),
      }));

      const controls = data.controls.map(control => ({
        type: control.type,
        wheal_size: control.wheal_size,
      }));

      const { error } = await supabase
        .from('test_sessions')
        .insert([
          {
            patientid: patientId,
            testdate: data.testdate,
            technician: data.technician,
            notes: data.notes || '',
            results,
            controls,
            status: 'completed',
          },
        ]);

      if (error) {
        toast.error('Error adding test session');
        return;
      }

      toast.success('Test session added successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Error adding test session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add Test Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testdate">Test Date</Label>
              <Input
                id="testdate"
                type="date"
                {...register('testdate')}
              />
              {errors.testdate && (
                <p className="text-sm text-destructive">{errors.testdate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Input
                id="technician"
                placeholder="Enter technician name"
                {...register('technician')}
              />
              {errors.technician && (
                <p className="text-sm text-destructive">{errors.technician.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about the test session"
              {...register('notes')}
            />
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {controlFields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <Label className="capitalize">{field.type} Control</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Wheal size (mm)"
                      {...register(`controls.${index}.wheal_size`, { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground">mm</span>
                  </div>
                  {errors.controls?.[index]?.wheal_size && (
                    <p className="text-sm text-destructive">
                      {errors.controls[index]?.wheal_size?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Allergens Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Allergens</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAllergen({ name: '', wheal_size: 0 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Allergen
              </Button>
            </div>

            <div className="space-y-3">
              {allergenFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Allergen name"
                      {...register(`allergens.${index}.name`)}
                    />
                    {errors.allergens?.[index]?.name && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.allergens[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Size"
                      {...register(`allergens.${index}.wheal_size`, { valueAsNumber: true })}
                    />
                    {errors.allergens?.[index]?.wheal_size && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.allergens[index]?.wheal_size?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-20 text-center">
                    {watchedAllergens[index]?.wheal_size > 0 && (
                      <Badge
                        variant={isPositive(watchedAllergens[index].wheal_size) ? "default" : "secondary"}
                        className="flex items-center space-x-1"
                      >
                        {isPositive(watchedAllergens[index].wheal_size) ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span>{isPositive(watchedAllergens[index].wheal_size) ? 'Pos' : 'Neg'}</span>
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAllergen(index)}
                    disabled={allergenFields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.allergens?.root && (
              <p className="text-sm text-destructive">{errors.allergens.root.message}</p>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Test Session'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};