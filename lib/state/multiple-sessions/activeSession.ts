import { atom, useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil';

// Atom to store the ID of the currently active MultiSessionItem for time selection
export const activeMultiSessionIdState = atom<string | null>({
    key: 'activeMultiSessionIdState',
    default: null, // No session is active by default
});

// Hook to get and set the active session ID
export const useActiveMultiSessionId = () => useRecoilState(activeMultiSessionIdState);

// Hook to only set the active session ID
export const useSetActiveMultiSessionId = () => useSetRecoilState(activeMultiSessionIdState);

// Hook to only read the active session ID
export const useActiveMultiSessionIdValue = () => useRecoilValue(activeMultiSessionIdState); 