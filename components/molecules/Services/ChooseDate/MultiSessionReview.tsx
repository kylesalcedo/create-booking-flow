import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useMultiSessionManager } from 'lib/state/multiple-sessions';
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns';
import { useFlowStep } from 'lib/state/booking-flow'; // To navigate to next step
import { Step } from 'lib/state/booking-flow/types'; // For step definition
// Import other necessary hooks/types, e.g., for cart, store, SDK calls
import { useCartState, useCartMethods } from 'lib/state/cart';
import { useCartStoreState } from 'lib/state/store';
import { Blvd } from '@boulevard/blvd-book-sdk'; // Assuming Blvd is globally available or imported correctly

export const MultiSessionReview = () => {
    const { sessions, removeSession, updateSessionStatus, clearSessions } = useMultiSessionManager();
    const { setStep } = useFlowStep();
    const cart = useCartState(); // Main cart, might not be used directly for each session booking
    const store = useCartStoreState();
    const { createCart, setCartCommonState } = useCartMethods(); // For creating temporary carts if needed

    const handleProceedToCheckout = async () => {
        console.log("Proceeding to checkout with sessions:", sessions);
        // TODO: Implement actual reservation logic for each session
        // This is a complex part depending on SDK capabilities

        for (const session of sessions) {
            if (session.status === 'pending') {
                try {
                    // Option 1: Use a new cart for each session reservation
                    // This is a simplified placeholder - actual implementation will be more complex
                    console.log(`Attempting to reserve session for service: ${session.service.item?.name} on ${session.date}`);
                    
                    // const tempCart = await Blvd.carts.create(store?.location); // Create a new cart for this session
                    // await tempCart.addBookableItem(session.service.item as any); // Cast might be needed if types differ for add
                    // const reservedCart = await tempCart.reserveBookableItems(session.selectedTime);
                    
                    // For now, just simulate success
                    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
                    updateSessionStatus(session.id, 'confirmed', { appointmentId: `fake-${session.id}` });
                    console.log(`Session ${session.id} confirmed (simulated)`);

                } catch (error) {
                    console.error(`Failed to reserve session ${session.id}:`, error);
                    updateSessionStatus(session.id, 'failed', { error: (error as Error).message });
                }
            }
        }
        // After attempting all, navigate or show summary of successes/failures
        // If all successful (or partially successful and user accepts), proceed to a consolidated payment step (if possible)
        // or to the next logical step if payments are per-session.
        alert("Reservation attempts complete. Check console. Next step would be payment/confirmation.");
        // Example: setStep(Step.PersonalInfo); // Or a new Step.MultiSessionConfirmation
    };

    const handleAddAnotherSession = () => {
        // This function needs to navigate the user to the appropriate place to add another session.
        // This could be: Resetting current selections in ChooseDate/ChooseTime, or going back to ServiceSelection.
        // For now, just an alert.
        alert("Navigating to add another session (placeholder).");
        // Example: Could clear current date/time selections and stay on ChooseDate/Time, or setStep(Step.SelectService)
        // For now, we assume the user can navigate back manually or we clear some state.
    };

    if (sessions.length === 0) {
        return null; // Don't render if no sessions are added yet
    }

    return (
        <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Your Selected Sessions
            </Typography>
            <List>
                {sessions.map((session) => (
                    <ListItem 
                        key={session.id} 
                        divider
                        secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => removeSession(session.id)} disabled={session.status !== 'pending'}>
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemText 
                            primary={`${session.service.item?.name || 'Service'} on ${formatDateFns(session.date, store?.location.tz, 'EEE, MMM d')}`}
                            secondary={`Time: ${formatDateFns(session.locationDisplayTime, store?.location.tz, TimeFormat)} - Staff: ${session.staff?.name || 'Any'} - Status: ${session.status}`}
                        />
                    </ListItem>
                ))}
            </List>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={handleAddAnotherSession}>
                    Add Another Session
                </Button>
                <Button variant="contained" onClick={handleProceedToCheckout} disabled={sessions.every(s => s.status !== 'pending')}>
                    Reserve All Pending & Proceed
                </Button>
            </Box>
        </Box>
    );
}; 