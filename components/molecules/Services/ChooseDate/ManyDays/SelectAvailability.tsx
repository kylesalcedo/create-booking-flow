import React, { useState, useEffect } from 'react'
import { Typography, Box, Button, Popover, Theme } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { styled } from '@mui/material/styles'
import { FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { SelectTime } from 'components/molecules/Services/ChooseDate/ManyDays/SelectTime'
import {
    useStaffTimes,
    useStaffTimesState,
    useTimesAreLoadingState,
} from 'lib/state/staffTime'
import { useCartStoreState } from 'lib/state/store'
import { SelectDate, Props as SelectDateProps } from 'components/molecules/Services/ChooseDate/SelectDate'
import { isSameDay } from 'date-fns'
import { CartBookableDate, Cart, CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'
import { useCartState } from 'lib/state/cart'
import { sortByDate } from 'lib/utils/sortUtils'
import formatDateFns from 'lib/utils/formatDateFns'
import { useMobile } from 'lib/utils/useMobile'
import { useTransition, animated, config } from 'react-spring'
import { MultiSessionReview } from '../MultiSessionReview'
import { useMultiSessionManager } from 'lib/state/multiple-sessions'
import { MultiSessionItem } from 'lib/state/multiple-sessions/types'

const SelectDateButton = styled(Button)(() => ({
    width: 145,
    height: 36,
    border: 'none',
    color: '#33343C',
    textTransform: 'capitalize',
    fontSize: '14px',
    fontWeight: 'normal',
    '&:hover': {
        border: 'none',
        backgroundColor: '#ffffff00',
    },
}))

const LoadMoreButton = styled(Button)(() => ({
    width: 134,
    height: 38,
    borderColor: '#C3C7CF',
    borderRadius: 4,
    color: '#33343C',
    textTransform: 'capitalize',
    fontSize: '14px',
    fontWeight: 'normal',
    '&:hover': {
        borderColor: '#C3C7CF',
        backgroundColor: '#F9F9FB',
    },
}))

interface StylesProps {
    isMobile: boolean
}

const useStyles = makeStyles((theme: Theme) => ({
    selectTimeDesktop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: theme.spacing(1),
    },
    selectTimeHeaderMobile: {
        position: 'fixed',
        top: '96px',
        width: '100%',
        backgroundColor: '#ffffff',
        'z-index': '1000',
        padding: '16px 16px 8px 16px',
        margin: '0 -16px',
        display: 'flex',
    },
    selectTimesBlock: {
        height: 'calc(100% - 44px)',
        margin: (props: StylesProps) => (props.isMobile ? '0 -16px' : 0),
        paddingTop: (props: StylesProps) => (props.isMobile ? '142px' : 0),
        overflowY: 'scroll',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    popover: {
        '& .MuiPopover-paper': {
            borderRadius: '8px',
            boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.15)',
        },
    },
}))

interface SelectAvailabilityProps {
    activeSessionId: string | null;
}

export const SelectAvailability = ({ activeSessionId }: SelectAvailabilityProps) => {
    const { isMobile } = useMobile()
    const classes = useStyles({ isMobile })
    const staffTimesArray = useStaffTimesState()
    const selectedStore = useCartStoreState()
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
    const [changeOpacity, setChangeOpacity] = useState(false)
    const [filteredDate, setFilteredDate] = useState<Date | undefined>(
        undefined
    )
    const [isShowSeeMoreButton, setIsShowSeeMoreButton] = useState(true)
    const { loadStaffTimes, loadNextTimesPage, clearStaffTimes } = useStaffTimes()
    const cart = useCartState() as Cart | undefined
    const timesAreLoading = useTimesAreLoadingState()

    const { sessions } = useMultiSessionManager();
    const activeSession: MultiSessionItem | undefined = sessions.find(s => s.id === activeSessionId);

    useEffect(() => {
        clearStaffTimes();
        setFilteredDate(undefined);
    }, [activeSessionId, clearStaffTimes]);

    const sortedSelectTimes = staffTimesArray
        .concat()
        .filter((x) => {
            return filteredDate !== undefined && isSameDay(filteredDate, x.date);
        })
        .sort(sortByDate);

    const handleSelectDateButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setChangeOpacity(true)
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)
    const id = open ? 'simple-popover' : undefined

    const onDayClick = async (
        day: Date,
        cartBookableDate: CartBookableDate
    ) => {
        handleClose()
        setFilteredDate(day)
        if (activeSession && cart && selectedStore) {
            const staffDate = { date: day, cartBookableDate };
            console.log('Loading staff times for active session:', activeSession.service.item.name, 'on day:', day);
            await loadStaffTimes(cart, staffDate, selectedStore.location.tz);
        } else {
            console.log('No active session or cart/store, clearing times.');
            clearStaffTimes();
        }
    }

    const onClearDateClick = () => {
        setFilteredDate(undefined)
        clearStaffTimes()
    }

    const seeMoreDays = async () => {
        setChangeOpacity(false)
        if (cart && selectedStore) {
            const hasMore = await loadNextTimesPage(cart, selectedStore.location.tz);
            setIsShowSeeMoreButton(hasMore);
        } else {
            setIsShowSeeMoreButton(false);
        }
    }

    const maxHeightValue = 200

    const transition = useTransition(sortedSelectTimes, {
        from: { opacity: changeOpacity ? 0 : 1, maxHeight: 0 },
        enter: { opacity: 1, maxHeight: maxHeightValue },
        leave: {
            opacity: 0,
            maxHeight: 0,
            config: { ...config.stiff, duration: 500 },
        },
        config: () => ({
            ...config.stiff,
            duration: filteredDate ? 0 : 1000,
        }),
        keys: (staffTimesItem) =>
            `selectTimeTransition-${staffTimesItem.day}-${staffTimesItem.month}-${staffTimesItem.year}`,
    })

    return (
        <>
            <Box
                className={
                    isMobile
                        ? classes.selectTimeHeaderMobile
                        : classes.selectTimeDesktop
                }
            >
                <Typography variant="h2">
                    Select a Time {activeSession ? `for ${activeSession.service.item.name}` : ''}
                </Typography>
                <SelectDateButton
                    variant="outlined"
                    disableRipple={true}
                    startIcon={<FiCalendar size={18} />}
                    endIcon={
                        !anchorEl ? (
                            <FiChevronDown size={15} />
                        ) : (
                            <FiChevronUp size={15} />
                        )
                    }
                    onClick={handleSelectDateButtonClick}
                    disabled={!activeSession}
                >
                    {filteredDate
                        ? formatDateFns(
                              filteredDate,
                              selectedStore?.location.tz,
                              'MM/dd/yyyy'
                          )
                        : 'Select date'}
                </SelectDateButton>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    className={classes.popover}
                >
                    <SelectDate
                        onDateSelect={onDayClick}
                        initialSelectedDate={filteredDate}
                    />
                </Popover>
            </Box>
            <Box className={classes.selectTimesBlock}>
                {transition(({ maxHeight, ...restStyle }, staffTimesItem) => (
                    <animated.div
                        style={{
                            ...restStyle,
                            maxHeight: maxHeight.to((x) => {
                                if (x < 5 && filteredDate) {
                                    return `0px`
                                }
                                return x > maxHeightValue - 10
                                    ? '100%'
                                    : `${x}px`
                            }),
                            overflow: maxHeight.to((x) =>
                                x > maxHeightValue - 10 ? '' : `hidden`
                            ),
                        }}
                        key={`selectTimeAnimated-${staffTimesItem.day}-${staffTimesItem.month}-${staffTimesItem.year}`}
                    >
                        <SelectTime
                            staffTimes={staffTimesItem}
                            store={selectedStore}
                            onClearDateClick={onClearDateClick}
                            filteredDate={filteredDate}
                            key={`selectTime-${staffTimesItem.day}-${staffTimesItem.month}-${staffTimesItem.year}`}
                            activeSession={activeSession}
                        />
                    </animated.div>
                ))}
                {sortedSelectTimes.length === 0 && !timesAreLoading && filteredDate && (
                    <Typography sx={{ textAlign: 'center', pt: 2 }}>
                        No availability for the selected date and service.
                    </Typography>
                )}
                {sortedSelectTimes.length === 0 && !timesAreLoading && !filteredDate && activeSession && (
                    <Typography sx={{ textAlign: 'center', pt: 2 }}>
                        Please select a date to see availability for {activeSession.service.item.name}.
                    </Typography>
                )}
                {timesAreLoading && (
                    <Typography sx={{ textAlign: 'center', pt: 2 }}>Loading...</Typography>
                )}
                {isShowSeeMoreButton &&
                    staffTimesArray.length > 0 &&
                    !filteredDate && (
                        <Box sx={{ textAlign: 'center', pt: 2, pb: 2 }}>
                            <LoadMoreButton onClick={seeMoreDays} disabled={!activeSession}>
                                See More Days
                            </LoadMoreButton>
                        </Box>
                    )}
            </Box>
        </>
    )
}
