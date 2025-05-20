import { atom, useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';
import { MultiSessionItem } from './types';
import { v4 as uuidv4 } from 'uuid';

export const multiSessionState = atom<MultiSessionItem[]>({
    key: 'multiSessionState',
    default: [],
});

export const useMultiSessionManager = () => {
    const [sessions, setSessions] = useRecoilState(multiSessionState);

    const addSession = (sessionData: Omit<MultiSessionItem, 'id' | 'status' | 'confirmationDetails'>): string => {
        const id = uuidv4();
        const newSession: MultiSessionItem = {
            ...sessionData,
            id,
            status: 'not_selected',
            confirmationDetails: null,
        };
        setSessions((prevSessions) => [...prevSessions, newSession]);
        return id;
    };

    const removeSession = (sessionId: string) => {
        setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));
    };

    const updateSessionStatus = (sessionId: string, status: MultiSessionItem['status'], confirmationDetails: MultiSessionItem['confirmationDetails'] = null) => {
        setSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === sessionId ? { ...session, status, confirmationDetails } : session
            )
        );
    };

    const updateSessionDetails = (sessionId: string, details: Partial<Omit<MultiSessionItem, 'id'>>) => {
        setSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === sessionId ? { ...session, ...details } : session
            )
        );
    };

    const clearSessions = () => {
        setSessions([]);
    };

    return {
        sessions,
        addSession,
        removeSession,
        updateSessionStatus,
        updateSessionDetails,
        clearSessions,
    };
};

export const useMultiSessionsValue = () => useRecoilValue(multiSessionState);
export const useSetMultiSessions = () => useSetRecoilState(multiSessionState); 