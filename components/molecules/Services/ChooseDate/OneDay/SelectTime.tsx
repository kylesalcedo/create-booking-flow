import { Box, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import React from 'react'
import { isSameDay } from 'date-fns'
import {
    useLoadingStaffTimeState,
    useStaffTimesState,
} from 'lib/state/staffTime'
import { DayTimes } from 'components/molecules/Services/ChooseDate/OneDay/DayTimes'
import { Store } from 'lib/state/store/types'
import { BounceLoader } from 'react-spinners'
import { useMobile } from 'lib/utils/useMobile'
import { useSelectedServices } from 'lib/state/services'
import { CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'

interface StylesProps {
    isMobile: boolean
}

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    dayTimeLoadingWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: (props: StylesProps) => (props.isMobile ? '50px' : '100px'),
        width: (props: StylesProps) => (props.isMobile ? '100%' : 'auto'),
    },
}))

interface Props {
    filteredDate?: Date
    store: Store | undefined
}

export const SelectTime = ({ filteredDate, store }: Props) => {
    const { isMobile } = useMobile()
    const classes = useStyles({ isMobile })
    const staffTimesArray = useStaffTimesState()
    const { selectedServicesStateValue } = useSelectedServices()

    const currentService: CartBookableItem | undefined = selectedServicesStateValue?.[0]

    const selectedDayTimes = staffTimesArray
        .concat()
        .filter((x) => {
            return filteredDate && isSameDay(filteredDate, x.date)
        })
        .flatMap((x) => x.times)

    const morningTimes = selectedDayTimes.filter(
        (x) => x.locationTime.getHours() < 12
    )

    const afternoonTimes = selectedDayTimes.filter(
        (x) => x.locationTime.getHours() >= 12 && x.locationTime.getHours() < 17
    )

    const eveningTimes = selectedDayTimes.filter(
        (x) => x.locationTime.getHours() >= 17
    )

    const loadingStaffTimeState = useLoadingStaffTimeState()
    return (
        <Box className={classes.root}>
            {loadingStaffTimeState && (
                <Box className={classes.dayTimeLoadingWrapper}>
                    <BounceLoader color="#dadada" size={60} />
                </Box>
            )}

            {!loadingStaffTimeState && currentService && filteredDate && (
                <>
                    <DayTimes
                        dayTimeName="Morning"
                        staffTimes={morningTimes}
                        store={store}
                        currentSelectedDate={filteredDate}
                        currentService={currentService}
                    />
                    <DayTimes
                        dayTimeName="Afternoon"
                        staffTimes={afternoonTimes}
                        store={store}
                        currentSelectedDate={filteredDate}
                        currentService={currentService}
                    />
                    <DayTimes
                        dayTimeName="Evening"
                        staffTimes={eveningTimes}
                        store={store}
                        currentSelectedDate={filteredDate}
                        currentService={currentService}
                    />
                </>
            )}
            {!loadingStaffTimeState && (!currentService || !filteredDate) && (
                 <Typography sx={{p:2, textAlign: 'center'}}>Please select a service and a date first.</Typography>
            )}
        </Box>
    )
}
