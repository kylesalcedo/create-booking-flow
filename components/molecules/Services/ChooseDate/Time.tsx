import React, { useContext } from 'react'
import { Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { StaffTime } from 'lib/state/staffTime/types'
import formatDateFns, { TimeFormat } from 'lib/utils/formatDateFns'
import { Store } from 'lib/state/store/types'
import { LayoutContext } from 'components/atoms/layout/LayoutContext'
import { CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'
import { useCartMethods, useCartState } from 'lib/state/cart'
import { useSelectedServices } from 'lib/state/services'

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
    const cart = useCartState()
    const { addService, selectStaff } = useCartMethods()
    const { selectedServicesStateValue } = useSelectedServices()

    const onSelectTimeAndAddSession = async () => {
        if (!currentService || !time.cartBookableTime) {
            console.error("Current service or bookable time is missing for multi-session add.")
            return
        }
        
        if (!cart) {
            console.error('Cart is not available when adding session')
            return
        }

        const staffDetails = currentService.selectedStaffVariant?.staff

        // Always create a new cart bookable item for the session to allow multiple reservations
        const beforeIds = selectedServicesStateValue.map((s) => s.id)
        try {
            // Add identical service again to cart to create a distinct bookable item
            const { cart: updatedCart, services } = await addService(cart, currentService.item)

            // Find the newly created CartBookableItem
            const newBookableItem = services.find((s) => !beforeIds.includes(s.id))
                ?? services[services.length - 1]

            // Apply staff selection (if any) – currently omitted to avoid type mismatch; TODO: map to internal Staff type if needed
            await selectStaff(updatedCart, newBookableItem, undefined)

            // Store the session referencing the newly created bookable item
            addSession({
                service: newBookableItem,
                staff: staffDetails,
                date: currentSelectedDate,
                selectedTime: time.cartBookableTime,
                locationDisplayTime: time.locationTime,
            })

            layout.setIsShowLoader(false)
            // TODO: Replace alert with snackbar/UX improvement
            alert('Session added! View your list of sessions or add another.')
        } catch (error) {
            console.error('Failed to add service for multi-session:', error)
            layout.setIsShowLoader(false)
            alert('Unable to add session. Please try again.')
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
            onClick={onSelectTimeAndAddSession}
        >
            {formatDateFns(time.locationTime, store?.location.tz, TimeFormat)}
        </Button>
    )
}
