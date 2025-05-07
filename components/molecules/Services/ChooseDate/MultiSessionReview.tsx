import React from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useMultiSessionManager } from 'lib/state/multiple-sessions';
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns';
// We might not need useFlowStep or Step here if navigation is handled by parent
// import { useFlowStep } from 'lib/state/booking-flow'; 
// import { Step } from 'lib/state/booking-flow/types'; 
import { useCartStoreState } from 'lib/state/store';
// Blvd and other SDK-specific imports for checkout will remain for handleProceedToCheckout

interface MultiSessionReviewProps {
    onAddAnotherSessionClicked?: () => void; // Optional callback to notify parent component
}

export const MultiSessionReview = ({ onAddAnotherSessionClicked }: MultiSessionReviewProps) => {
    const { sessions, removeSession, updateSessionStatus } = useMultiSessionManager();
    const store = useCartStoreState();

    const handleProceedToCheckout = async () => {
        console.log("Proceeding to checkout with sessions:", sessions);
        for (const session of sessions) {
            if (session.status === 'pending') {
                try {
                    console.log(`Attempting to reserve session for service: ${session.service.item?.name} on ${session.date}`);
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                    updateSessionStatus(session.id, 'confirmed', { appointmentId: `fake-${session.id}` });
                    console.log(`Session ${session.id} confirmed (simulated)`);
                } catch (error) {
                    console.error(`Failed to reserve session ${session.id}:`, error);
                    updateSessionStatus(session.id, 'failed', { error: (error as Error).message });
                }
            }
        }
        alert("Reservation attempts complete. Check console. Next step would be payment/confirmation.");
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