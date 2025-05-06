import { Typography, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { StaffTimes, StaffTime as StaffTimeType } from 'lib/state/staffTime/types'
import formatDateFns from 'lib/utils/formatDateFns'
import { Store } from 'lib/state/store/types'
import { differenceInDays, isSameDay } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { useMobile } from 'lib/utils/useMobile'
import { DisplayTime } from 'components/molecules/Services/ChooseDate/DisplayTime'
import { useSelectedServices } from 'lib/state/services'
import { CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'
import React from 'react'

const useStyles = makeStyles(() => ({
    timeBlock: {
        borderBottom: '1px dashed #C3C7CF',
    },
    dayTopRow: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'center',
    },
    clearDateSelection: {
        textDecoration: 'underline',
        cursor: 'pointer',
        marginLeft: '20px',
    },
    buttonsWrapper: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
}))

interface Props {
    staffTimes: StaffTimes
    store: Store | undefined
    onClearDateClick: () => void
    filteredDate?: Date
}

export const SelectTime = ({
    staffTimes,
    store,
    onClearDateClick,
    filteredDate,
}: Props) => {
    const { isMobile } = useMobile()
    const classes = useStyles()
    const { selectedServicesStateValue } = useSelectedServices()

    const currentService: CartBookableItem | undefined = selectedServicesStateValue?.[0]

    const individualTimeSlots = staffTimes.times
    const currentDateForTheseSlots = staffTimes.date

    const timeZone = store?.location.tz
    const todayAtLocation = utcToZonedTime(new Date(), timeZone)
    todayAtLocation.setHours(0)

    const getDifferenceInDaysText = (date: Date): string => {
        if (isSameDay(date, todayAtLocation)) {
            return 'today'
        }
        const diff = differenceInDays(date, todayAtLocation)
        return `${diff + 1}d away`
    }

    if (!currentService) {
        return (
            <Box sx={{ pt: 3, pb: 2 }} className={classes.timeBlock}>
                <Typography sx={{ textAlign: 'center', width: '100%' }}>Please select a service first.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ pt: 3, pb: 2 }} className={classes.timeBlock}>
            <Box
                className={classes.dayTopRow}
                sx={{ padding: isMobile ? '0 16px' : 0 }}
            >
                <Box>
                    <Typography variant="h3" component="span">
                        {formatDateFns(
                            currentDateForTheseSlots,
                            store?.location.tz,
                            'EEEE, MMM d'
                        )}
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ pl: 1 }}>
                        {getDifferenceInDaysText(currentDateForTheseSlots)}
                    </Typography>
                </Box>
                {filteredDate && isSameDay(filteredDate!, currentDateForTheseSlots) && (
                    <Typography
                        variant="body1"
                        component="span"
                        className={classes.clearDateSelection}
                        onClick={onClearDateClick}
                    >
                        Clear date selection
                    </Typography>
                )}
            </Box>
            <Box
                className={classes.buttonsWrapper}
                sx={{ padding: isMobile ? '16px 16px 0 16px' : '16px 0 0 0' }}
            >
                {individualTimeSlots.map((timeSlot: StaffTimeType) => (
                    <DisplayTime
                        key={'time' + timeSlot.cartBookableTime?.id}
                        time={timeSlot}
                        store={store}
                        currentSelectedDate={currentDateForTheseSlots}
                        currentService={currentService}
                    />
                ))}
                {individualTimeSlots.length === 0 && (
                    <Typography fontWeight={500} color={'#C4C4C4'}>
                        No available times for this day.
                    </Typography>
                )}
            </Box>
        </Box>
    )
}
