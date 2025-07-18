import { CartBookableItem, CartBookableTime } from '@boulevard/blvd-book-sdk/lib/cart';
import { Staff } from 'lib/state/staff/types';

export interface MultiSessionItem {
    id: string; // A unique ID for this pending session (e.g., nanoid())
    service: CartBookableItem; // Or just the necessary details like serviceId, name
    staff?: Staff; // Changed type from any to Staff
    date?: Date; // Made optional
    selectedTime?: CartBookableTime; // Made optional - The SDK object for reservation
    locationDisplayTime?: Date; // Made optional - The Date object for display, in location's timezone
    status: 'pending' | 'confirmed' | 'failed' | 'not_selected'; // Added 'not_selected'
    confirmationDetails?: any; // Store appointment ID or error message after attempt, or other relevant details from booking.
} 