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
        if (sessions && sessions.length > 0) {
            const currentActiveSession = sessions.find(s => s.id === activeSessionId);

            // Case 1: No active session ID, or current active session is invalid/doesn't exist in the list
            if (!activeSessionId || !currentActiveSession) {
                const firstSessionToSchedule = sessions.find(session => !session.selectedTime);
                if (firstSessionToSchedule) {
                    setActiveSessionId(firstSessionToSchedule.id);
                } else { // All sessions have times, or no sessions need scheduling
                    setActiveSessionId(sessions[0].id); // Default to the first session
                }
            }
            // Case 2: Active session ID is set, but it already has a time, and others don't
            // This part is removed to allow users to click on already scheduled sessions
            // if (currentActiveSession && currentActiveSession.selectedTime) {
            //     const nextSessionToSchedule = sessions.find(session => !session.selectedTime);
            //     if (nextSessionToSchedule && nextSessionToSchedule.id !== activeSessionId) {
            //         // setActiveSessionId(nextSessionToSchedule.id);
            //     }
            // }
        } else {
            // No sessions, so no active session Id
            if (activeSessionId !== null) {
                setActiveSessionId(null);
            }
        }
    }, [sessions, activeSessionId, setActiveSessionId]);

    const allSessionsTrulyScheduled = sessions && sessions.length > 0 && sessions.every(s => !!s.selectedTime);
    const activeSessionExists = !!(activeSessionId && sessions && sessions.find(s => s.id === activeSessionId));

    const rightPanelBtnCaption = () => {
        if (allSessionsTrulyScheduled) return "Continue to Next Step";

        // Caption for the button when an active session is selected and a time slot is picked for IT
        const currentSession = sessions?.find(s => s.id === activeSessionId);
        if (currentSession && !currentSession.selectedTime && selectedStaffTime?.locationTime) {
            return `Confirm ${formatDateFns(
                selectedStaffTime.locationTime,
                selectedStore?.location.tz,
                'h:mmaaa'
            )} for ${currentSession.service.item.name}`;
        }
        return 'Select a Time'; // Default when no specific time slot is picked for the active session yet
    };
    
    const showContinueButton = activeSessionExists || allSessionsTrulyScheduled;

    return (
        <WithLayout
            isShowLoader={false}
            leftPanel={<CurrentSessionDisplayPanel sessions={sessions || []} activeSessionId={activeSessionId} />}
            rightPanel={
                <>
                    {activeSessionExists && dateTimeType === DateTimeType.ShowTimeForOneDay && (
                        <ShowTimeForOneDayComponent activeSessionId={activeSessionId} sessions={sessions || []} />
                    )}
                    {activeSessionExists && dateTimeType === DateTimeType.ShowTimeForManyDays && (
                        <ShowTimeForManyDaysComponent activeSessionId={activeSessionId} />
                    )}
                    {!activeSessionExists && sessions && sessions.length > 0 && !allSessionsTrulyScheduled && (
                        <Typography sx={{p:2, textAlign: 'center'}}>
                            Please select an appointment from the left to schedule its time.
                        </Typography>
                    )}
                    {allSessionsTrulyScheduled && (
                         <Typography sx={{p:2, textAlign: 'center'}}>
                            All appointments have times selected. Click &quot;Continue to Next Step&quot;.
                         </Typography>
                    )}
                     {(!sessions || sessions.length === 0) && (
                        <Typography sx={{p:2, textAlign: 'center'}}>
                            There are no sessions to schedule. Please go back and select services.
                        </Typography>
                    )}
                </>
            }
            rightPanelCaption={
                activeSessionExists ? "Select an availability" 
                : allSessionsTrulyScheduled ? "Ready to Continue" 
                : (sessions && sessions.length > 0 ? "Select a Session" : "No Sessions")
            }
            rightPanelBtnCaption={rightPanelBtnCaption()}
            showBottom={showContinueButton}
            addBackArrow={isMobile}
            backArrowStep={Step.SelectedServices}
            workshopPanel={<WorkshopPanel />}
        />
    )
}
