import React, { useState, useContext, useEffect } from 'react'
import { Grid, Theme, Typography, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { SelectDate } from 'components/molecules/Services/ChooseDate/SelectDate'
import { StaffsInfoList } from 'components/molecules/Services/ChooseDate/OneDay/StaffsInfoList'
import { CartBookableDate } from '@boulevard/blvd-book-sdk/lib/cart'
import { useSetLoadingStaffTimeState, useStaffTimes, useSelectedStaffTimeState, useSetSelectedStaffTimeState } from 'lib/state/staffTime'
import { useCartStoreState } from 'lib/state/store'
import { SelectTime } from 'components/molecules/Services/ChooseDate/OneDay/SelectTime'
import { cartTimeToDate } from 'lib/utils/formatDateFns'
import { useStaffDates } from 'lib/state/staffDate'
import formatDateFns from 'lib/utils/formatDateFns'
import { useCartState } from 'lib/state/cart'
import { LayoutContext } from 'components/atoms/layout/LayoutContext'
import { useMobile } from 'lib/utils/useMobile'
import { MultiSessionReview } from '../MultiSessionReview'
import { MultiSessionItem } from 'lib/state/multiple-sessions/types'

interface StylesProps {
    isMobile: boolean
}

interface ShowTimeForOneDayComponentProps {
    activeSessionId: string | null;
    sessions: MultiSessionItem[];
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        overflowY: 'scroll',
        position: 'sticky',
        height: 'calc(100%)',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    rightPanelWrapper: {
        padding: (props: StylesProps) =>
            !props.isMobile ? theme.spacing(4) : theme.spacing(2, 4),
    },
    left: {
        [theme.breakpoints.up('lg')]: {
            minWidth: '370px',
            maxWidth: '370px',
        },
        [theme.breakpoints.down('lg')]: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        },
    },
    right: {
        [theme.breakpoints.up('lg')]: {
            maxWidth: 'calc(100% - 370px) !important',
        },
        [theme.breakpoints.down('lg')]: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: (props: StylesProps) =>
                !props.isMobile ? theme.spacing(4) : theme.spacing(1),
        },
        paddingBottom: (props: StylesProps) =>
            props.isMobile ? theme.spacing(6) : 0,
    },
    rightWrapper: {
        [theme.breakpoints.down('lg')]: {
            width: '320px',
        },
    },
    selectedDay: {
        width: '320px',
        borderBottom: `3px solid ${theme.palette.primary.main}`,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
    },
}))

export const ShowTimeForOneDayComponent = ({ activeSessionId, sessions }: ShowTimeForOneDayComponentProps) => {
    const { isMobile } = useMobile()
    const classes = useStyles({ isMobile })
    const cart = useCartState()
    const activeSession = sessions.find(s => s.id === activeSessionId);

    const { getStaffDateState } = useStaffDates()
    const staffDatesStore = getStaffDateState()

    const [filteredDate, setFilteredDate] = useState<Date | undefined>(() => {
        if (activeSession?.date) return new Date(activeSession.date);
        return cartTimeToDate(
            cart?.startTime,
            staffDatesStore &&
                staffDatesStore.length > 0 &&
                staffDatesStore[0].dates.length > 0
                ? staffDatesStore[0].dates[0].date
                : new Date()
        );
    });
    const setLoadingStaffTimeState = useSetLoadingStaffTimeState()
    const selectedStore = useCartStoreState()
    const { loadStaffTimes, clearStaffTimes } = useStaffTimes()
    const layout = useContext(LayoutContext)
    const selectedStaffTime = useSelectedStaffTimeState()
    const setSelectedStaffTime = useSetSelectedStaffTimeState()

    useEffect(() => {
        if (activeSessionId) {
            setSelectedStaffTime(undefined);
            if(clearStaffTimes) clearStaffTimes();
            
            const currentActiveSessionDetails = sessions.find(s => s.id === activeSessionId);
            if (currentActiveSessionDetails?.date) {
                setFilteredDate(new Date(currentActiveSessionDetails.date));
            } else {
                const firstDate = staffDatesStore && staffDatesStore.length > 0 && staffDatesStore[0].dates.length > 0 
                                ? staffDatesStore[0].dates[0].date 
                                : new Date();
                setFilteredDate(cartTimeToDate(cart?.startTime, firstDate)); 
            }
            if (layout.setShowBottom) layout.setShowBottom(false); 
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSessionId, sessions, setSelectedStaffTime, clearStaffTimes, cart?.startTime, staffDatesStore]);

    useEffect(() => {
        if (selectedStaffTime === undefined && layout.setShowBottom) {
            layout.setShowBottom(false)
        }
    }, [selectedStaffTime, layout.setShowBottom]);

    const onDayClick = async (
        day: Date,
        cartBookableDate: CartBookableDate
    ) => {
        if (!activeSession) return;

        setSelectedStaffTime(undefined)
        setFilteredDate(day)
        setLoadingStaffTimeState(true)
        const staffDate = {
            date: day,
            cartBookableDate: cartBookableDate,
        }
        loadStaffTimes(cart, staffDate, selectedStore?.location.tz, activeSession).finally(
            () => {
                setLoadingStaffTimeState(false)
            }
        )
    }
    
    if (!activeSession) {
        return <Box p={2} textAlign="center"><Typography>No active session selected or session not found.</Typography></Box>;
    }

    return (
        <Box className={classes.root}>
            <Grid container className={classes.rightPanelWrapper}>
                <Grid item lg={5} md={12} sm={12} xs={12} className={classes.left}>
                    <Box>
                        {isMobile && <StaffsInfoList />}
                        <Box className={classes.selectedDay}>
                            <Typography variant="h3" component="span">
                                {formatDateFns(
                                    filteredDate,
                                    selectedStore?.location.tz,
                                    'EEEE, MMMM d'
                                )}
                            </Typography>
                        </Box>
                        <SelectDate
                            onDateSelect={onDayClick}
                            initialSelectedDate={filteredDate}
                            key={activeSessionId}
                        />
                    </Box>
                </Grid>
                <Grid item lg={7} md={12} sm={12} xs={12} className={classes.right}>
                    <Box className={classes.rightWrapper}>
                        {!isMobile && <StaffsInfoList />}
                        <SelectTime
                            filteredDate={filteredDate}
                            store={selectedStore}
                            activeSession={activeSession}
                        />
                        <MultiSessionReview />
                        <Box sx={{ pt: 8 }} />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
