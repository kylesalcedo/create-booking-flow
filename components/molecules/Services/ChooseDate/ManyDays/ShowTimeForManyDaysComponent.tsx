import React from 'react'
import { SelectAvailability } from 'components/molecules/Services/ChooseDate/ManyDays/SelectAvailability'
import { Box, Theme } from '@mui/material'
import { makeStyles } from '@mui/styles'
// import { stepScreen } from 'constants/styles' // Not needed if styles are local
import { MultiSessionReview } from '../MultiSessionReview'

const useStyles = makeStyles((theme: Theme) => ({
    rightPanelWrapper: {
        paddingTop: '11px',
        paddingLeft: '20px',
        paddingRight: '20px',
        height: '100%',
        overflowY: 'scroll',
        position: 'sticky',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    // blurScreen: stepScreen(theme).blurScreen, // Keep if used, or remove
    // loader: stepScreen(theme).loader,       // Keep if used, or remove
}))

interface ShowTimeForManyDaysComponentProps {
    activeSessionId: string | null;
}

export const ShowTimeForManyDaysComponent = ({ activeSessionId }: ShowTimeForManyDaysComponentProps) => {
    const classes = useStyles()
    return (
        <Box className={classes.rightPanelWrapper}>
            {/* Pass activeSessionId to SelectAvailability */}
            <SelectAvailability activeSessionId={activeSessionId} /> 
            <MultiSessionReview />
        </Box>
    )
}
