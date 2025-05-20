import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useMultiSessionManager } from 'lib/state/multiple-sessions';
import { useActiveMultiSessionIdValue, useSetActiveMultiSessionId } from 'lib/state/multiple-sessions/activeSession';

export const MultiSessionSelectorPanel = () => {
    const { sessions } = useMultiSessionManager();
    const activeSessionId = useActiveMultiSessionIdValue();
    const setActiveSessionId = useSetActiveMultiSessionId();

    if (!sessions || sessions.length === 0) {
        return <Typography sx={{ p: 2 }}>No sessions to select.</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Select Session to Schedule
            </Typography>
            <List>
                {sessions.map((session, index) => (
                    <ListItem key={session.id} disablePadding>
                        <ListItemButton
                            selected={session.id === activeSessionId}
                            onClick={() => setActiveSessionId(session.id)}
                        >
                            <ListItemText 
                                primary={`Session ${index + 1}: ${session.service.item.name}`}
                                secondary={
                                    session.selectedTime && session.locationDisplayTime && session.date
                                      ? `Time: ${new Date(session.locationDisplayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                                      : session.selectedTime && session.locationDisplayTime
                                      ? `Time: ${new Date(session.locationDisplayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Date not set)`
                                      : session.selectedTime
                                      ? 'Time selected (Details pending)'
                                      : 'Time not set'
                                  }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}; 