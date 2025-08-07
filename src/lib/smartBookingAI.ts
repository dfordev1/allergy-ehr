import { addDays, format, isWeekend, getHours, setHours, setMinutes } from 'date-fns';

export interface BookingSuggestion {
  id: string;
  type: 'optimal_time' | 'alternative_date' | 'duration_optimization' | 'priority_adjustment';
  title: string;
  description: string;
  confidence: number;
  action: () => void;
  icon: string;
}

export interface PatientProfile {
  name: string;
  phone: string;
  email?: string;
  previousBookings?: Array<{
    date: string;
    time: string;
    testType: string;
    status: string;
  }>;
  preferences?: {
    preferredTime?: 'morning' | 'afternoon' | 'evening';
    preferredDays?: string[];
    avoidWeekends?: boolean;
  };
}

export interface BookingContext {
  selectedDate?: Date;
  selectedTime?: string;
  testType?: string;
  patientName?: string;
  existingBookings: Array<{
    appointment_date: string;
    appointment_time: string;
    test_type: string;
    status: string;
  }>;
}

export class SmartBookingAI {
  private static instance: SmartBookingAI;
  private patientProfiles: Map<string, PatientProfile> = new Map();

  static getInstance(): SmartBookingAI {
    if (!SmartBookingAI.instance) {
      SmartBookingAI.instance = new SmartBookingAI();
    }
    return SmartBookingAI.instance;
  }

  // Analyze booking patterns and generate intelligent suggestions
  generateBookingSuggestions(context: BookingContext): BookingSuggestion[] {
    const suggestions: BookingSuggestion[] = [];

    // 1. Optimal Time Suggestions
    if (context.selectedDate) {
      const optimalTimes = this.getOptimalTimeSlots(context);
      optimalTimes.forEach((time, index) => {
        suggestions.push({
          id: `optimal_time_${index}`,
          type: 'optimal_time',
          title: `Best Time: ${time}`,
          description: `Based on clinic efficiency and patient flow patterns`,
          confidence: 0.85 - (index * 0.1),
          action: () => {
            // This would be handled by the parent component
            console.log(`Setting optimal time: ${time}`);
          },
          icon: '⏰'
        });
      });
    }

    // 2. Alternative Date Suggestions
    if (context.selectedDate && this.isDateSuboptimal(context.selectedDate, context)) {
      const betterDates = this.suggestBetterDates(context.selectedDate, context);
      betterDates.forEach((date, index) => {
        suggestions.push({
          id: `alt_date_${index}`,
          type: 'alternative_date',
          title: `Better Date: ${format(date, 'MMM dd, yyyy')}`,
          description: `${this.getDateBenefit(date, context)}`,
          confidence: 0.75 - (index * 0.05),
          action: () => {
            console.log(`Suggesting date: ${format(date, 'yyyy-MM-dd')}`);
          },
          icon: '📅'
        });
      });
    }

    // 3. Duration Optimization
    if (context.testType) {
      const durationSuggestion = this.optimizeDuration(context.testType, context);
      if (durationSuggestion) {
        suggestions.push(durationSuggestion);
      }
    }

    // 4. Priority Adjustment Suggestions
    const prioritySuggestion = this.suggestPriority(context);
    if (prioritySuggestion) {
      suggestions.push(prioritySuggestion);
    }

    // 5. Patient-Specific Suggestions
    if (context.patientName) {
      const patientSuggestions = this.getPatientSpecificSuggestions(context.patientName, context);
      suggestions.push(...patientSuggestions);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // Get optimal time slots based on clinic efficiency
  private getOptimalTimeSlots(context: BookingContext): string[] {
    const date = context.selectedDate!;
    const dayOfWeek = date.getDay();
    const existingBookings = context.existingBookings.filter(
      b => b.appointment_date === format(date, 'yyyy-MM-dd')
    );

    // Define optimal time slots based on day and existing bookings
    let optimalSlots: string[] = [];

    // Morning slots (usually less crowded)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
      optimalSlots = ['09:00', '09:30', '10:00', '10:30'];
    } else {
      optimalSlots = ['10:00', '10:30', '11:00'];
    }

    // Filter out already booked slots
    const bookedTimes = existingBookings.map(b => b.appointment_time);
    return optimalSlots.filter(slot => !bookedTimes.includes(slot));
  }

  // Check if selected date is suboptimal
  private isDateSuboptimal(date: Date, context: BookingContext): boolean {
    // Check if it's a weekend and patient prefers weekdays
    if (isWeekend(date)) return true;

    // Check if the day is heavily booked
    const dayBookings = context.existingBookings.filter(
      b => b.appointment_date === format(date, 'yyyy-MM-dd')
    );
    
    return dayBookings.length > 8; // Arbitrary threshold
  }

  // Suggest better dates
  private suggestBetterDates(originalDate: Date, context: BookingContext): Date[] {
    const suggestions: Date[] = [];
    
    // Try next 7 days
    for (let i = 1; i <= 7; i++) {
      const candidateDate = addDays(originalDate, i);
      
      // Skip weekends unless necessary
      if (isWeekend(candidateDate) && i <= 5) continue;
      
      // Check booking density
      const dayBookings = context.existingBookings.filter(
        b => b.appointment_date === format(candidateDate, 'yyyy-MM-dd')
      );
      
      if (dayBookings.length < 6) {
        suggestions.push(candidateDate);
      }
      
      if (suggestions.length >= 3) break;
    }
    
    return suggestions;
  }

  // Get benefit description for suggested date
  private getDateBenefit(date: Date, context: BookingContext): string {
    const dayBookings = context.existingBookings.filter(
      b => b.appointment_date === format(date, 'yyyy-MM-dd')
    );
    
    if (dayBookings.length === 0) {
      return 'First appointment of the day - no waiting time';
    } else if (dayBookings.length < 3) {
      return 'Light schedule - shorter wait times expected';
    } else {
      return 'Better availability than selected date';
    }
  }

  // Duration optimization is no longer needed since we removed duration field
  private optimizeDuration(testType: string, context: BookingContext): BookingSuggestion | null {
    // Duration field has been removed from the booking system
    return null;
  }

  // Suggest priority based on test type and urgency indicators
  private suggestPriority(context: BookingContext): BookingSuggestion | null {
    const urgentTests = ['Drug Allergy Test', 'Comprehensive Panel'];
    const highPriorityTests = ['Food Allergy Test', 'Insect Venom Test'];

    if (context.testType && urgentTests.includes(context.testType)) {
      return {
        id: 'priority_urgent',
        type: 'priority_adjustment',
        title: 'Consider Urgent Priority',
        description: `${context.testType} often requires immediate attention`,
        confidence: 0.8,
        action: () => {
          console.log('Setting priority to urgent');
        },
        icon: '🚨'
      };
    }

    if (context.testType && highPriorityTests.includes(context.testType)) {
      return {
        id: 'priority_high',
        type: 'priority_adjustment',
        title: 'Suggest High Priority',
        description: `${context.testType} typically benefits from priority scheduling`,
        confidence: 0.7,
        action: () => {
          console.log('Setting priority to high');
        },
        icon: '⚡'
      };
    }

    return null;
  }

  // Get patient-specific suggestions based on history
  private getPatientSpecificSuggestions(patientName: string, context: BookingContext): BookingSuggestion[] {
    const profile = this.patientProfiles.get(patientName);
    if (!profile || !profile.previousBookings) return [];

    const suggestions: BookingSuggestion[] = [];

    // Analyze previous booking patterns
    const previousTimes = profile.previousBookings.map(b => b.time);
    const mostCommonTime = this.getMostFrequent(previousTimes);

    if (mostCommonTime && context.selectedTime !== mostCommonTime) {
      suggestions.push({
        id: 'patient_preferred_time',
        type: 'optimal_time',
        title: `Patient Usually Books ${mostCommonTime}`,
        description: `Based on ${profile.previousBookings.length} previous appointments`,
        confidence: 0.75,
        action: () => {
          console.log(`Setting patient preferred time: ${mostCommonTime}`);
        },
        icon: '👤'
      });
    }

    return suggestions;
  }

  // Utility function to find most frequent item in array
  private getMostFrequent<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const frequency: Record<string, number> = {};
    items.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const mostFrequent = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );

    return items.find(item => String(item) === mostFrequent) || null;
  }

  // Learn from booking patterns
  updatePatientProfile(patientName: string, booking: {
    date: string;
    time: string;
    testType: string;
    status: string;
  }): void {
    const existing = this.patientProfiles.get(patientName) || {
      name: patientName,
      phone: '',
      previousBookings: []
    };

    existing.previousBookings = existing.previousBookings || [];
    existing.previousBookings.push(booking);

    // Keep only last 10 bookings
    if (existing.previousBookings.length > 10) {
      existing.previousBookings = existing.previousBookings.slice(-10);
    }

    this.patientProfiles.set(patientName, existing);
  }

  // Get smart auto-complete suggestions for patient names
  getPatientSuggestions(partial: string): string[] {
    const suggestions = Array.from(this.patientProfiles.keys())
      .filter(name => name.toLowerCase().includes(partial.toLowerCase()))
      .sort()
      .slice(0, 5);

    return suggestions;
  }

  // Predict optimal booking slots for next week
  predictOptimalSlots(testType: string): Array<{date: Date, time: string, confidence: number}> {
    const predictions: Array<{date: Date, time: string, confidence: number}> = [];
    
    // Simple prediction based on historical patterns
    for (let i = 1; i <= 7; i++) {
      const date = addDays(new Date(), i);
      if (!isWeekend(date)) {
        // Morning slots typically have higher confidence
        predictions.push({
          date,
          time: '09:00',
          confidence: 0.9
        });
        predictions.push({
          date,
          time: '10:30',
          confidence: 0.85
        });
      }
    }

    return predictions.slice(0, 10);
  }
}

// Export singleton instance
export const smartBookingAI = SmartBookingAI.getInstance();