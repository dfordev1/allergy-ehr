import { SimpleBookingSystem } from '@/components/booking/SimpleBookingSystem';
import { AppHeader } from '@/components/layout/AppHeader';

export const SimpleBooking = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SimpleBookingSystem />
    </div>
  );
};