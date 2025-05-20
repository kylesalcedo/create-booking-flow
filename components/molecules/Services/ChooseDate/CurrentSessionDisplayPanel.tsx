import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { MultiSessionItem } from 'lib/state/multiple-sessions/types';
import { useActiveMultiSessionId } from 'lib/state/multiple-sessions/activeSession';

interface CurrentSessionDisplayPanelProps {
    sessions: MultiSessionItem[];
    activeSessionId: string | null;
}

export const CurrentSessionDisplayPanel = ({ sessions, activeSessionId }: CurrentSessionDisplayPanelProps) => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const currentIndex = activeSession ? sessions.findIndex(s => s.id === activeSessionId) : -1;
    const [, setActiveSessionId] = useActiveMultiSessionId();

    if (!sessions || sessions.length === 0) {
        return <Typography sx={{ p: 2 }}>No sessions selected.</Typography>;
    }

    return (
        <Paper elevation={1} sx={{ m: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Scheduling Appointments ({currentIndex !== -1 ? currentIndex + 1 : '-'} of {sessions.length})
            </Typography>
            
            {activeSession && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Currently Scheduling:
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Service: <strong>{activeSession.service.item.name}</strong>
                    </Typography>
                    {activeSession.staff && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Staff: {activeSession.staff.name || 'Any Staff'}
                        </Typography>
                    )}
                    {activeSession.selectedTime && activeSession.locationDisplayTime && (
                        <Chip 
                            label={`Time Selected: ${activeSession.locationDisplayTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })} on ${activeSession.date.toLocaleDateString()}`}
                            color="success"
                            size="small"
                        />
                    )}
                </Box>
            )}

            <Typography variant="subtitle2" gutterBottom>All Selected Appointments:</Typography>
            <List dense disablePadding>
                {sessions.map((session, index) => (
                    <ListItem 
                        key={session.id} 
                        divider 
                        onClick={() => setActiveSessionId(session.id)}
                        sx={{
                            backgroundColor: session.id === activeSessionId ? 'action.hover' : 'transparent',
                            mb: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: session.id === activeSessionId ? 'action.hover' : 'action.disabledBackground',
                            }
                        }}
                    >
                        <ListItemText 
                            primary={`${index + 1}. ${session.service.item.name}`}
                            secondary={
                                <> 
                                    {session.staff ? `Staff: ${session.staff.name || 'Any'}` : 'Any Staff'}
                                    {session.selectedTime && session.date && session.locationDisplayTime && (
                                        <Typography component="span" display="block" variant="caption" color="text.secondary">
                                            {`Time: ${session.locationDisplayTime.toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric'})} on ${new Date(session.date).toLocaleDateString()}`}
                                        </Typography>
                                    )}
                                    {!session.selectedTime && (
                                        <Typography component="span" display="block" variant="caption" color="error">
                                            Pending Time Selection
                                        </Typography>
                                    )}
                                </>
                            }
                        />
                        {session.id === activeSessionId && (
                            <Chip label="Current" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                         {session.selectedTime && (
                            <Chip label="Time Set" color="success" variant="outlined" size="small" sx={{ ml: 1 }} />
                        )}
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}; 