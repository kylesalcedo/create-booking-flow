import React, { useContext } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useMultiSessionManager } from 'lib/state/multiple-sessions';
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns';
import { useCartStoreState } from 'lib/state/store';
import { useCartMethods, useCartState } from 'lib/state/cart';
import { LayoutContext } from 'components/atoms/layout/LayoutContext';
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
        if (!cart) {
            alert('Cart not found. Please try again.');
            return;
        }

        layout.setIsShowLoader(true);
        let hasError = false;
        for (const session of sessions) {
            if (session.status !== 'pending') continue;

            try {
                await reserveBookableTime(cart, session.selectedTime, store);
                updateSessionStatus(session.id, 'confirmed', { appointmentId: session.selectedTime?.id });
            } catch (error) {
                console.error(`Failed to reserve session ${session.id}:`, error);
                updateSessionStatus(session.id, 'failed', { error: (error as Error).message });
                hasError = true;
            }
        }

        layout.setIsShowLoader(false);

        if (hasError) {
            alert('Some sessions could not be reserved. Please review and try again.');
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