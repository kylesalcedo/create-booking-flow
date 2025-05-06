import React, { useContext } from 'react'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { StaffTime } from 'lib/state/staffTime/types'
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns'
import { Store } from 'lib/state/store/types'
import { LayoutContext } from 'components/atoms/layout/LayoutContext'
import { CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'

const useStyles = makeStyles(() => ({
    selectTimeBtn: {
        width: 68,
        height: 32,
        fontWeight: 500,
        textTransform: 'lowercase',
    },
}))

interface Props {
    time: StaffTime
    store: Store | undefined
    currentSelectedDate: Date
    currentService: CartBookableItem
}

export const Time = ({ time, store, currentSelectedDate, currentService }: Props) => {
    const classes = useStyles()
    const layout = useContext(LayoutContext)
    const { addSession } = useMultiSessionManager()

    const onSelectTimeAndAddSession = async () => {
        if (!currentService || !time.cartBookableTime) {
            console.error("Current service or bookable time is missing for multi-session add.")
            return
        }
        
        const staffDetails = currentService.selectedStaffVariant?.staff

        addSession({
            service: currentService,
            staff: staffDetails,
            date: currentSelectedDate,
            selectedTime: time.cartBookableTime,
            locationDisplayTime: time.locationTime,
        })
        alert('Session added! View your list of sessions or add another.')
    }

    return (
        <Button
            key={'time' + time.cartBookableTime?.id}
            variant="contained"
            className={classes.selectTimeBtn}
            sx={{
                mr: 1,
                mb: 1,
            }}
            onClick={onSelectTimeAndAddSession}
        >
            {formatDateFns(time.locationTime, store?.location.tz, TimeFormat)}
        </Button>
    )
}
