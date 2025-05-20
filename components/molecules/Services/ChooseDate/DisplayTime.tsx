import { StaffTime } from 'lib/state/staffTime/types'
import { Store } from 'lib/state/store/types'
import { useSelectedStaffTimeState } from 'lib/state/staffTime'
import { SelectedTime } from 'components/molecules/Services/ChooseDate/SelectedTime'
import { Time } from 'components/molecules/Services/ChooseDate/Time'
import { MultiSessionItem } from 'lib/state/multiple-sessions/types';
import React from 'react'

interface Props {
    time: StaffTime
    store: Store | undefined
    currentSelectedDate: Date
    activeSession: MultiSessionItem;
}

export const DisplayTime = ({ time, store, currentSelectedDate, activeSession }: Props) => {
    const selectedStaffTime = useSelectedStaffTimeState()
    if (time.cartBookableTime?.id === selectedStaffTime?.cartBookableTime?.id) {
        return <SelectedTime store={store} />
    }

    return <Time time={time} store={store} currentSelectedDate={currentSelectedDate} activeSession={activeSession} />
}
