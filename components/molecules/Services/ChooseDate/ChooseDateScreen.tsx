import React, { useEffect } from 'react'
import WithLayout from 'components/atoms/layout/WithLayout'
import { DateTimeType, useAppConfig } from 'lib/state/config'
import { ShowTimeForOneDayComponent } from 'components/molecules/Services/ChooseDate/OneDay/ShowTimeForOneDayComponent'
import { ShowTimeForManyDaysComponent } from 'components/molecules/Services/ChooseDate/ManyDays/ShowTimeForManyDaysComponent'
import { Step } from 'lib/state/booking-flow/types'
import { useMobile } from 'lib/utils/useMobile'
import formatDateFns from 'lib/utils/formatDateFns'
import { useCartStoreState } from 'lib/state/store'
import { useSelectedStaffTimeState } from 'lib/state/staffTime'
import { WorkshopPanel } from 'components/molecules/Services/ChooseDate/WorkshopPanel'
import { CurrentSessionDisplayPanel } from './CurrentSessionDisplayPanel'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'
import { useActiveMultiSessionId, useActiveMultiSessionIdValue } from 'lib/state/multiple-sessions/activeSession'
import { Typography } from '@mui/material'

export default function ChooseDateScreen() {
    const { isMobile } = useMobile()
    const { getDateTimeType } = useAppConfig()
    const dateTimeType = getDateTimeType()
    const selectedStaffTime = useSelectedStaffTimeState()
    const selectedStore = useCartStoreState()

    const { sessions } = useMultiSessionManager();
    const [activeSessionId, setActiveSessionId] = useActiveMultiSessionId();

    useEffect(() => {
        // If there's no active session ID, and there are sessions,
        // set the first session without a selected time as active.
        // If all have times, set the first session as active.
        if (!activeSessionId && sessions && sessions.length > 0) {
            const firstSessionToSchedule = sessions.find(session => !session.selectedTime);
            if (firstSessionToSchedule) {
                setActiveSessionId(firstSessionToSchedule.id);
            } else {
                setActiveSessionId(sessions[0].id);
            }
        }
    }, [sessions, activeSessionId, setActiveSessionId]);

    const allSessionsScheduled = sessions.every(s => !!s.selectedTime);

    const rightPanelBtnCaption = () => {
        if (allSessionsScheduled) return "Continue to Next Step";
        if (selectedStaffTime?.locationTime) {
            return `Continue with ${formatDateFns(
                selectedStaffTime.locationTime,
                selectedStore?.location.tz,
                'h:mmaaa'
            )}`;
        }
        return 'Select a Time';
    };

    return (
        <WithLayout
            isShowLoader={false}
            leftPanel={<CurrentSessionDisplayPanel sessions={sessions} activeSessionId={activeSessionId} />}
            rightPanel={
                <>
                    {activeSessionId && dateTimeType === DateTimeType.ShowTimeForOneDay && (
                        <ShowTimeForOneDayComponent activeSessionId={activeSessionId} />
                    )}
                    {activeSessionId && dateTimeType === DateTimeType.ShowTimeForManyDays && (
                        <ShowTimeForManyDaysComponent activeSessionId={activeSessionId} />
                    )}
                    {!activeSessionId && sessions.length > 0 && !allSessionsScheduled && (
                        <Typography sx={{p:2, textAlign: 'center'}}>Please wait, selecting next session...</Typography>
                    )}
                    {!activeSessionId && allSessionsScheduled && (
                        <Typography sx={{p:2, textAlign: 'center'}}>All appointments have times selected. Click Continue.</Typography>
                    )}
                </>
            }
            rightPanelCaption={activeSessionId ? "Select an availability" : (allSessionsScheduled ? "Ready to Continue" : "Loading sessions...")}
            rightPanelBtnCaption={rightPanelBtnCaption()}
            showBottom={!!activeSessionId || allSessionsScheduled}
            addBackArrow={isMobile}
            backArrowStep={Step.SelectedServices}
            workshopPanel={<WorkshopPanel />}
        />
    )
}
