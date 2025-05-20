import React from 'react'
import { Button, Theme } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { StaffTime } from 'lib/state/staffTime/types'
import { Store } from 'lib/state/store/types'
import { useSetSelectedStaffTimeState } from 'lib/state/staffTime'
import { useCartMethods, useCartState } from 'lib/state/cart'
import { useAppConfig } from 'lib/state/config'
import { useFlowStep } from 'lib/state/booking-flow'
import { Step } from 'lib/state/booking-flow/types'
import { Cart, CartBookableTime } from '@boulevard/blvd-book-sdk/lib/cart'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'
import { MultiSessionItem } from 'lib/state/multiple-sessions/types'

const useStyles = makeStyles((theme: Theme) => ({
    button: {
        width: '100%',
        minWidth: '80px',
        height: '36px',
        margin: theme.spacing(0.5, 0, 0.5, 0),
    },
}))

interface Props {
    time: StaffTime
    store: Store | undefined
    currentSelectedDate: Date | undefined
    activeSession: MultiSessionItem | undefined
}

export const DisplayTime = ({ time, store, currentSelectedDate, activeSession }: Props) => {
    const classes = useStyles()
    const cart = useCartState() as Cart | undefined
    const setSelectedStaffTime = useSetSelectedStaffTimeState()
    const { reserveBookableTime } = useCartMethods()
    const { updateSessionDetails } = useMultiSessionManager()

    const onTimeSelect = async () => {
        if (!time.cartBookableTime) {
            console.error('No cartBookableTime available for this time slot.')
            return
        }
        if (!activeSession || !activeSession.service) {
            console.error('No active session or active session service to associate time with.')
            return
        }

        setSelectedStaffTime(time)
        
        const cartWithReservedTime: Cart | undefined = await reserveBookableTime(
            cart,
            time.cartBookableTime,
            store
        )

        if (currentSelectedDate) {
            const updatedSessionData: Partial<MultiSessionItem> = {
                date: currentSelectedDate,
                selectedTime: time.cartBookableTime as CartBookableTime,
                locationDisplayTime: time.locationTime,
                status: cartWithReservedTime ? 'pending' : 'failed',
            }
            updateSessionDetails(activeSession.id, updatedSessionData)
            console.log(
                'Updated session:', activeSession.id,
                'with time:', time.cartBookableTime.startTime,
                'status:', updatedSessionData.status
            )
        }
    }

    const isDisabled = !activeSession || !activeSession.service || !time.cartBookableTime

    return (
        <Button
            variant="outlined"
            className={classes.button}
            onClick={onTimeSelect}
            disabled={isDisabled}
        >
            {time.locationTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
            })}
        </Button>
    )
} 