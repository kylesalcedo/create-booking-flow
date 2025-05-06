import { atom, useRecoilState } from 'recoil';
import { MultiSessionItem } from './types';
import { nanoid } from 'nanoid'; // For generating unique IDs

export const multiSessionItemsState = atom<MultiSessionItem[]> ({
    key: 'multiSessionItemsState',
    default: [],
});

// Custom hook to manage multi-session items
export const useMultiSessionManager = () => {
    const [sessions, setSessions] = useRecoilState(multiSessionItemsState);

    const addSession = (sessionData: Omit<MultiSessionItem, 'id' | 'status' | 'confirmationDetails'>) => {
        const newSession: MultiSessionItem = {
            ...sessionData,
            id: nanoid(),
            status: 'pending',
        };
        setSessions((prevSessions) => [...prevSessions, newSession]);
        return newSession.id; // Return ID of the newly added session
    };

    const removeSession = (sessionId: string) => {
        setSessions((prevSessions) => prevSessions.filter(session => session.id !== sessionId));
    };

    const updateSessionStatus = (sessionId: string, status: MultiSessionItem['status'], confirmationDetails?: any) => {
        setSessions((prevSessions) =>
            prevSessions.map(session =>
                session.id === sessionId ? { ...session, status, confirmationDetails } : session
            )
        );
    };

    const clearSessions = () => {
        setSessions([]);
    }

    return { sessions, addSession, removeSession, updateSessionStatus, clearSessions };
}; 