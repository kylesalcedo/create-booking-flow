import React from 'react'
import { Box, Typography } from '@mui/material'
import FirstLastName from 'components/molecules/Services/PersonalInfo/FirstLastName'
import { ClientSearchAutocomplete } from 'components/molecules/Services/PersonalInfo/ClientSearchAutocomplete'

export default function BasicInfo() {
    return (
        <Box>
            <Typography variant="h3" sx={{ pb: 1 }}>
                Basic info
            </Typography>
            <Box sx={{ mb: 2 }}>
                <ClientSearchAutocomplete />
            </Box>
            <FirstLastName />
        </Box>
    )
}
