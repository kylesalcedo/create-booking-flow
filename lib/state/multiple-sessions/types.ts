import { CartBookableItem, CartBookableTime } from '@boulevard/blvd-book-sdk/lib/cart';

export interface MultiSessionItem {
    id: string; // A unique ID for this pending session (e.g., nanoid())
    service: CartBookableItem; // Or just the necessary details like serviceId, name
    staff?: any; // Staff details if selected, align with your Staff type. Consider defining a specific Staff type if available.
    date: Date; // This is the date of the session
    selectedTime: CartBookableTime; // The SDK object for reservation
    locationDisplayTime: Date; // The Date object for display, in location's timezone
    status: 'pending' | 'confirmed' | 'failed';
    confirmationDetails?: any; // Store appointment ID or error message after attempt, or other relevant details from booking.
} 