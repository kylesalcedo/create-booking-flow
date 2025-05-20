import React, { useContext, useState } from 'react'
import { Button, CircularProgress } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { StaffTime } from 'lib/state/staffTime/types'
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns'
import { Store } from 'lib/state/store/types'
import { LayoutContext } from 'components/atoms/layout/LayoutContext'
import { MultiSessionItem } from 'lib/state/multiple-sessions/types'
import { useMultiSessionManager } from 'lib/state/multiple-sessions/index'
import { useCartMethods, useCartState } from 'lib/state/cart'

const useStyles = makeStyles(() => ({
    selectTimeBtn: {
        width: 68,
        height: 32,
        fontWeight: 500,
        textTransform: 'lowercase',
        position: 'relative',
    },
    loader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    }
}))

interface Props {
    time: StaffTime
    store: Store | undefined
    currentSelectedDate: Date
    activeSession: MultiSessionItem;
}

export const Time = ({ time, store, currentSelectedDate, activeSession }: Props) => {
    const classes = useStyles()
    const layout = useContext(LayoutContext)
    const { updateSessionDetails } = useMultiSessionManager()
    const cart = useCartState()
    const { reserveBookableTime } = useCartMethods()
    const [isLoading, setIsLoading] = useState(false);

    const onTimeSelect = async () => {
        if (!activeSession || !time.cartBookableTime || !cart) {
            console.error("Active session, bookable time, or cart is missing.")
            return
        }
        
        setIsLoading(true);
        layout.setIsShowLoader(true);

        try {
            const updatedCart = await reserveBookableTime(cart, time.cartBookableTime, store)

            if (updatedCart) {
                updateSessionDetails(activeSession.id, {
                    date: currentSelectedDate,
                    selectedTime: time.cartBookableTime,
                    locationDisplayTime: time.locationTime,
                    status: 'pending',
                });
                layout.setShowBottom(true);
            } else {
                updateSessionDetails(activeSession.id, {
                    date: currentSelectedDate,
                    selectedTime: time.cartBookableTime,
                    locationDisplayTime: time.locationTime,
                    status: 'failed',
                });
                alert('Failed to reserve this time slot. Please try another.')
            }
        } catch (error) {
            console.error('Error reserving time:', error)
            updateSessionDetails(activeSession.id, {
                date: currentSelectedDate,
                selectedTime: time.cartBookableTime,
                locationDisplayTime: time.locationTime,
                status: 'failed',
            });
            alert('An error occurred while reserving this time. Please try again.')
        } finally {
            setIsLoading(false);
            layout.setIsShowLoader(false);
        }
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
            onClick={onTimeSelect}
            disabled={isLoading}
        >
            {isLoading ? <CircularProgress size={24} className={classes.loader} /> : formatDateFns(time.locationTime, store?.location.tz, TimeFormat)}
        </Button>
    )
}
