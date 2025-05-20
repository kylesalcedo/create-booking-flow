import { useState, useCallback, useMemo, useEffect } from 'react'
import { Modifiers, DayPicker, SelectSingleEventHandler } from 'react-day-picker'
import { Theme, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import 'react-day-picker/dist/style.css'
import { useStaffDates, staffDatesState as globalStaffDatesAtom } from 'lib/state/staffDate'
import { CartBookableDate, CartBookableItem } from '@boulevard/blvd-book-sdk/lib/cart'
import { useRecoilValue } from 'recoil'
import { isSameDay } from 'date-fns'

const useStyles = makeStyles((theme: Theme) => ({
    dayPickerWrapper: {
        backgroundColor: '#ffffff',
        boxShadow:
            '0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
        width: '310px',
        height: '323px',
        padding: theme.spacing(3, 1, 1, 1),
    },
    calendarDayPicker: {
        width: '100%',
        height: '100%',
        '& .DayPicker-Caption': {
            padding: '0 10px !important',
            '& div': {
                fontWeight: 'normal !important',
                fontSize: '16px !important',
                textTransform: 'capitalize',
            },
        },
        '& .DayPicker-WeekdaysRow': {
            justifyContent: 'space-between',
        },
        '& .DayPicker-Weekday abbr': {
            fontSize: '12px',
        },
        '&.DayPicker:not(.DayPicker--interactionDisabled) .DayPicker-Day:not(.DayPicker-Day--disabled):not(.DayPicker-Day--selected):not(.DayPicker-Day--outside):hover > div > div > div':
            {
                backgroundColor: '#e2e8ed !important',
                borderRadius: '50% !important',
                color: '#33343C !important',
            },
    },
    calendarDayCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
    },
    notAvailable: {
        '& div > div': {
            textDecoration: 'line-through',
            color: '#C3C7CF',
        },
    },
    disabled: {
        '& div > div': {
            color: '#C3C7CF',
        },
    },
    dateWrapper: {
        display: 'inline-block',
        width: '36px',
        height: '36px',
        lineHeight: '35px',
        marginTop: '-15px',
        boxSizing: 'content-box',
        fontSize: '14px',
        fontWeight: 400,
    },
    today: {
        color: '#33343C !important',
        textDecoration: 'underline !important',
        textUnderlineOffset: '2px !important',
        textDecorationThickness: '2px !important',
        fontWeight: 'bold!important' as any,
    },
    selected: {
        backgroundColor: theme.palette.primary.main,
        borderRadius: '50%',
        color: `${theme.palette.primary.contrastText} !important`,
    },
    calendarDayDate: {
        height: 0,
        lineHeight: 0,
    },
}))

export interface Props {
    onDateSelect: (day: Date, cartBookableDate: CartBookableDate) => void
    initialSelectedDate?: Date
}

export const SelectDate = ({ onDateSelect, initialSelectedDate }: Props) => {
    const classes = useStyles()
    const staffDatesFromGlobalState = useRecoilValue(globalStaffDatesAtom)
    const { loadStaffDates } = useStaffDates()

    const fromMonth = useMemo(() => {
        const today = new Date()
        today.setDate(1)
        return today
    }, [])

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialSelectedDate)
    const [displayedMonth, setDisplayedMonth] = useState<Date>(initialSelectedDate || fromMonth)

    useEffect(() => {
        if (initialSelectedDate) {
            setDisplayedMonth(initialSelectedDate)
            setSelectedDate(initialSelectedDate)
        } else {
            setDisplayedMonth(fromMonth)
            setSelectedDate(undefined)
        }
    }, [initialSelectedDate, fromMonth])
    
    const getAllowedDaysInMonth = useCallback((month: Date): { date: Date; cartBookableDate: CartBookableDate }[] => {
        return staffDatesFromGlobalState
            .filter(
                (staffDatesItem) =>
                    staffDatesItem.year === month.getUTCFullYear() &&
                    staffDatesItem.month === month.getUTCMonth()
            )
            .flatMap((staffDatesItem) => staffDatesItem.dates)
            .map((staffDate) => ({ date: new Date(staffDate.date), cartBookableDate: staffDate.cartBookableDate! }))
    }, [staffDatesFromGlobalState])

    const onMonthChange = async (month: Date) => {
        setDisplayedMonth(month)
    }

    const handleDateSelect: SelectSingleEventHandler = (day, selectedDay, activeModifiers) => {
        if (activeModifiers.disabled || !selectedDay) {
            setSelectedDate(undefined)
            return
        }
        
        const daysInMonth = getAllowedDaysInMonth(selectedDay)
        const matchingBookableDateEntry = daysInMonth.find(
            (x) => isSameDay(x.date, selectedDay)
        )
        
        if (matchingBookableDateEntry && matchingBookableDateEntry.cartBookableDate) {
            setSelectedDate(selectedDay)
            onDateSelect(selectedDay, matchingBookableDateEntry.cartBookableDate)
        } else {
            setSelectedDate(undefined)
        }
    }

    const isDisabled = useCallback((day: Date): boolean => {
        if (day < fromMonth) {
            return true
        }
        const daysInMonth = getAllowedDaysInMonth(day)
        return !daysInMonth.some(d => isSameDay(d.date, day))
    }, [fromMonth, getAllowedDaysInMonth])

    return (
        <Box className={classes.dayPickerWrapper}>
            <DayPicker
                mode="single"
                month={displayedMonth}
                className={classes.calendarDayPicker}
                fromMonth={fromMonth}
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDisabled}
                onMonthChange={onMonthChange}
                showOutsideDays
                modifiersClassNames={{
                    selected: classes.selected,
                    today: classes.today,
                    disabled: classes.disabled,
                }}
            />
        </Box>
    )
}
