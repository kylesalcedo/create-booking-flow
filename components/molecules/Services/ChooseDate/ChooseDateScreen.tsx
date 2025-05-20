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
import { MultiSessionSelectorPanel } from './MultiSessionSelectorPanel'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'
import { useActiveMultiSessionIdValue, useSetActiveMultiSessionId } from 'lib/state/multiple-sessions/activeSession'

export default function ChooseDateScreen() {
    const { isMobile } = useMobile()
    const { getDateTimeType } = useAppConfig()
    const dateTimeType = getDateTimeType()
    const selectedStaffTime = useSelectedStaffTimeState()
    const selectedStore = useCartStoreState()

    const { sessions } = useMultiSessionManager();
    const activeSessionId = useActiveMultiSessionIdValue();
    const setActiveSessionId = useSetActiveMultiSessionId();

    useEffect(() => {
        if (!activeSessionId && sessions && sessions.length > 0) {
            setActiveSessionId(sessions[0].id);
        }
    }, [sessions, activeSessionId, setActiveSessionId]);

    return (
        <WithLayout
            isShowLoader={false}
            leftPanel={<MultiSessionSelectorPanel />}
            rightPanel={
                <>
                    {dateTimeType === DateTimeType.ShowTimeForOneDay && (
                        <ShowTimeForOneDayComponent />
                    )}
                    {dateTimeType === DateTimeType.ShowTimeForManyDays && (
                        <ShowTimeForManyDaysComponent />
                    )}
                </>
            }
            rightPanelCaption="Select an availability"
            rightPanelBtnCaption={`Continue with ${selectedStaffTime?.locationTime ? formatDateFns(
                selectedStaffTime?.locationTime,
                selectedStore?.location.tz,
                'h:mmaaa'
            ) : 'selected time'}`}
            showBottom={!!selectedStaffTime}
            addBackArrow={isMobile}
            backArrowStep={Step.SelectedServices}
            workshopPanel={<WorkshopPanel />}
        />
    )
}
