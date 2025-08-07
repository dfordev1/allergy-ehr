import { supabase } from '@/integrations/supabase/client';
import { 
  SkinTestOrder, 
  SkinTestResult, 
  CustomAllergen, 
  SkinTestPanel,
  PatientHandout,
  ExtractOrder,
  InjectionAdministration,
  ContactlessCheckin,
  BiologicAdministration,
  AutoCharging,
  SpirometryResult,
  RPMData,
  AAAAIQCDRReport
} from '@/types/allergy-practice';
import { toast } from 'sonner';

export class AllergyPracticeApiService {
  
  // ==================== SKIN TEST ORDERS & RESULTS ====================
  
  static async createSkinTestOrder(orderData: Omit<SkinTestOrder, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('skin_test_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Skin test order created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating skin test order:', error);
      toast.error('Failed to create skin test order');
      return { data: null, error };
    }
  }

  static async getSkinTestOrders(patientId?: string) {
    try {
      let query = supabase
        .from('skin_test_orders')
        .select(`
          *,
          patient:patients(name, labno)
        `)
        .order('order_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching skin test orders:', error);
      return { data: null, error };
    }
  }

  static async updateSkinTestOrderStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('skin_test_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Order status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      return { data: null, error };
    }
  }

  static async createSkinTestResult(resultData: Omit<SkinTestResult, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('skin_test_results')
        .insert([resultData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Test results recorded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating test result:', error);
      toast.error('Failed to record test results');
      return { data: null, error };
    }
  }

  // ==================== CUSTOM ALLERGENS & PANELS ====================
  
  static async createCustomAllergen(allergenData: Omit<CustomAllergen, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('custom_allergens')
        .insert([allergenData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Custom allergen created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating custom allergen:', error);
      toast.error('Failed to create custom allergen');
      return { data: null, error };
    }
  }

  static async getCustomAllergens() {
    try {
      const { data, error } = await supabase
        .from('custom_allergens')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching custom allergens:', error);
      return { data: null, error };
    }
  }

  static async createSkinTestPanel(panelData: Omit<SkinTestPanel, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('skin_test_panels')
        .insert([panelData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Skin test panel created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating skin test panel:', error);
      toast.error('Failed to create skin test panel');
      return { data: null, error };
    }
  }

  static async getSkinTestPanels() {
    try {
      const { data, error } = await supabase
        .from('skin_test_panels')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching skin test panels:', error);
      return { data: null, error };
    }
  }

  // ==================== PATIENT HANDOUTS ====================
  
  static async generatePatientHandout(handoutData: Omit<PatientHandout, 'id' | 'generated_date'>) {
    try {
      const { data, error } = await supabase
        .from('patient_handouts')
        .insert([{ ...handoutData, generated_date: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Patient handout generated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error generating patient handout:', error);
      toast.error('Failed to generate patient handout');
      return { data: null, error };
    }
  }

  static async getPatientHandouts(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('patient_handouts')
        .select('*')
        .eq('patient_id', patientId)
        .order('generated_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching patient handouts:', error);
      return { data: null, error };
    }
  }

  // ==================== EXTRACT ORDERS & VIAL MIXING ====================
  
  static async createExtractOrder(orderData: Omit<ExtractOrder, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('extract_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Extract order created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating extract order:', error);
      toast.error('Failed to create extract order');
      return { data: null, error };
    }
  }

  static async getExtractOrders(patientId?: string) {
    try {
      let query = supabase
        .from('extract_orders')
        .select(`
          *,
          patient:patients(name, labno)
        `)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching extract orders:', error);
      return { data: null, error };
    }
  }

  static async updateExtractOrderStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('extract_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Extract order status updated');
      return { data, error: null };
    } catch (error) {
      console.error('Error updating extract order status:', error);
      toast.error('Failed to update extract order status');
      return { data: null, error };
    }
  }

  // ==================== INJECTION ADMINISTRATION ====================
  
  static async recordInjectionAdministration(injectionData: Omit<InjectionAdministration, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('injection_administrations')
        .insert([injectionData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Injection administration recorded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error recording injection administration:', error);
      toast.error('Failed to record injection administration');
      return { data: null, error };
    }
  }

  static async getInjectionHistory(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('injection_administrations')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching injection history:', error);
      return { data: null, error };
    }
  }

  // ==================== CONTACTLESS CHECK-IN ====================
  
  static async createContactlessCheckin(checkinData: Omit<ContactlessCheckin, 'id' | 'check_in_time'>) {
    try {
      const { data, error } = await supabase
        .from('contactless_checkins')
        .insert([{ ...checkinData, check_in_time: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Patient checked in successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating contactless checkin:', error);
      toast.error('Failed to check in patient');
      return { data: null, error };
    }
  }

  static async getTodaysCheckins() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('contactless_checkins')
        .select(`
          *,
          patient:patients(name, labno)
        `)
        .gte('appointment_date', today)
        .lt('appointment_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching today\'s checkins:', error);
      return { data: null, error };
    }
  }

  // ==================== BIOLOGIC ADMINISTRATION ====================
  
  static async recordBiologicAdministration(biologicData: Omit<BiologicAdministration, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('biologic_administrations')
        .insert([biologicData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Biologic administration recorded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error recording biologic administration:', error);
      toast.error('Failed to record biologic administration');
      return { data: null, error };
    }
  }

  static async getBiologicHistory(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('biologic_administrations')
        .select('*')
        .eq('patient_id', patientId)
        .order('administration_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching biologic history:', error);
      return { data: null, error };
    }
  }

  // ==================== SPIROMETRY & RPM ====================
  
  static async recordSpirometryResult(spirometryData: Omit<SpirometryResult, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('spirometry_results')
        .insert([spirometryData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Spirometry results recorded successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error recording spirometry result:', error);
      toast.error('Failed to record spirometry results');
      return { data: null, error };
    }
  }

  static async recordRPMData(rpmData: Omit<RPMData, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('rpm_data')
        .insert([rpmData])
        .select()
        .single();

      if (error) throw error;
      
      if (rpmData.alert_triggered) {
        toast.warning('RPM alert triggered - provider notified');
      } else {
        toast.success('RPM data recorded successfully');
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error recording RPM data:', error);
      toast.error('Failed to record RPM data');
      return { data: null, error };
    }
  }

  // ==================== AUTO-CHARGING ====================
  
  static async createAutoCharge(chargeData: Omit<AutoCharging, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('auto_charging')
        .insert([chargeData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Charge created and queued for submission');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating auto charge:', error);
      toast.error('Failed to create charge');
      return { data: null, error };
    }
  }

  static async getCharges(patientId?: string, status?: string) {
    try {
      let query = supabase
        .from('auto_charging')
        .select(`
          *,
          patient:patients(name, labno)
        `)
        .order('service_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching charges:', error);
      return { data: null, error };
    }
  }

  // ==================== AAAAI QCDR INTEGRATION ====================
  
  static async generateQCDRReport(reportData: Omit<AAAAIQCDRReport, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('aaaai_qcdr_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('QCDR report generated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Error generating QCDR report:', error);
      toast.error('Failed to generate QCDR report');
      return { data: null, error };
    }
  }

  static async getQCDRReports() {
    try {
      const { data, error } = await supabase
        .from('aaaai_qcdr_reports')
        .select('*')
        .order('reporting_period', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching QCDR reports:', error);
      return { data: null, error };
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  static async searchPatients(query: string) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, labno, age, sex')
        .or(`name.ilike.%${query}%, labno.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching patients:', error);
      return { data: null, error };
    }
  }

  static async getDashboardStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get various counts for dashboard
      const [
        ordersResult,
        injectionsResult,
        checkinsResult,
        chargesResult,
        patientsResult,
        appointmentsResult
      ] = await Promise.all([
        supabase.from('skin_test_orders').select('id', { count: 'exact' }).gte('order_date', today),
        supabase.from('injection_administrations').select('id', { count: 'exact' }).gte('visit_date', today),
        supabase.from('contactless_checkins').select('id', { count: 'exact' }).gte('appointment_date', today),
        supabase.from('auto_charging').select('id, amount', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('patients').select('id', { count: 'exact' }),
        supabase.from('simple_bookings').select('id', { count: 'exact' }).gte('appointment_date', today)
      ]);

      // Calculate total pending charges amount
      const totalPendingCharges = chargesResult.data?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;

      // Simulate growth percentages (in real app, these would be calculated from historical data)
      const weeklyGrowth = 12; // 12% growth
      const monthlyRevenue = 45000; // $45,000 monthly revenue

      return {
        todaysOrders: ordersResult.count || 0,
        todaysInjections: injectionsResult.count || 0,
        todaysCheckins: checkinsResult.count || 0,
        pendingCharges: totalPendingCharges,
        weeklyGrowth,
        monthlyRevenue,
        activePatients: patientsResult.count || 0,
        upcomingAppointments: appointmentsResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todaysOrders: 0,
        todaysInjections: 0,
        todaysCheckins: 0,
        pendingCharges: 0,
        weeklyGrowth: 0,
        monthlyRevenue: 0,
        activePatients: 0,
        upcomingAppointments: 0
      };
    }
  }
}