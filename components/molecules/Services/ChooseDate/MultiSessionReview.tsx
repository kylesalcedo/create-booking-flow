import React, { useContext } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useMultiSessionManager } from 'lib/state/multiple-sessions';
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns';
import { useCartMethods, useCartState } from 'lib/state/cart';
import { useCartStoreState } from 'lib/state/store';
import { LayoutContext } from 'components/atoms/layout/LayoutContext';
import { Blvd } from 'lib/sdk/blvd';
import { Location } from '@boulevard/blvd-book-sdk/lib/locations';
// We might not need useFlowStep or Step here if navigation is handled by parent
// import { useFlowStep } from 'lib/state/booking-flow'; 
// import { Step } from 'lib/state/booking-flow/types'; 
// Blvd and other SDK-specific imports for checkout will remain for handleProceedToCheckout

interface MultiSessionReviewProps {
    onAddAnotherSessionClicked?: () => void; // Optional callback to notify parent component
}

export const MultiSessionReview = ({ onAddAnotherSessionClicked }: MultiSessionReviewProps) => {
    const { sessions, removeSession, updateSessionStatus } = useMultiSessionManager();
    const store = useCartStoreState();
    const { reserveBookableTime } = useCartMethods();
    const cart = useCartState();
    const layout = useContext(LayoutContext);

    const handleProceedToCheckout = async () => {
        layout.setIsShowLoader(true);
        let hasError = false;
        for (const session of sessions) {
            if (session.status !== 'pending') continue;

            try {
                const location: Location | undefined = store?.location as unknown as Location;
                const sessionCart = await Blvd.carts.create(location);

                // Add service to cart
                const cartAfterAdd = await sessionCart.addBookableItem(session.service.item);

                // TODO optional staff variant assignment

                // Reserve start time for the single item
                await cartAfterAdd.reserveBookableItems(session.selectedTime);

                // If no payment required, checkout immediately to create appointment
                if (!cartAfterAdd.summary.paymentMethodRequired) {
                    const payload = await cartAfterAdd.checkout();
                    const appointmentId = payload?.appointments?.[0]?.appointmentId;
                    updateSessionStatus(session.id, 'confirmed', { appointmentId });
                } else {
                    // If payment required, leave as pending or handle payment flow
                    updateSessionStatus(session.id, 'failed', { error: 'Payment required' });
                    hasError = true;
                }
            } catch (error) {
                console.error(`Failed to reserve session ${session.id}:`, error);
                updateSessionStatus(session.id, 'failed', { error: (error as Error).message });
                hasError = true;
            }
        }

        layout.setIsShowLoader(false);

        if (hasError) {
            alert('Some sessions were not reserved.');
        } else {
            alert('All sessions successfully reserved!');
        }
    };

    const handleAddAnotherSessionInternal = () => {
        onAddAnotherSessionClicked?.(); // Only invoke if the parent supplied a handler
    };

    if (sessions.length === 0) {
        return null; 
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
                <Button variant="outlined" onClick={handleAddAnotherSessionInternal}>
                    Add Another Session
                </Button>
                <Button variant="contained" onClick={handleProceedToCheckout} disabled={sessions.every(s => s.status !== 'pending') || sessions.length === 0}>
                    Reserve All Pending & Proceed
                </Button>
            </Box>
        </Box>
    );
}; 