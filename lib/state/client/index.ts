import { atom, useRecoilState, useResetRecoilState, useSetRecoilState, useRecoilValue } from 'recoil'

export interface ClientInfo {
    id: string
    name: string
    email?: string
    mobilePhone?: string
}

const selectedClientState = atom<ClientInfo | undefined>({
    key: 'selectedClientState',
    default: undefined,
})

export const useSelectedClientState = () => useRecoilState(selectedClientState)
export const useSetSelectedClientState = () => useSetRecoilState(selectedClientState)
export const useResetSelectedClientState = () => useResetRecoilState(selectedClientState)
export const useClientValue = () => useRecoilValue(selectedClientState) 