import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import FirstLastName from 'components/molecules/Services/PersonalInfo/FirstLastName'
import { ClientSearchAutocomplete } from 'components/molecules/Services/PersonalInfo/ClientSearchAutocomplete'
import { useClientValue, useResetSelectedClientState } from 'lib/state/client'
import { useFormikContext } from 'formik'
import { firstNameFieldName, lastNameFieldName, emailFieldName, phoneFieldName } from './ts/constants'

export default function BasicInfo() {
    const selectedClient = useClientValue()
    const resetSelectedClient = useResetSelectedClientState()
    const { setFieldValue } = useFormikContext<any>()

    const handleChangeClient = () => {
        resetSelectedClient()
        setFieldValue(firstNameFieldName, '')
        setFieldValue(lastNameFieldName, '')
        setFieldValue(emailFieldName, '')
        setFieldValue(phoneFieldName, '')
    }

    return (
        <Box>
            <Typography variant="h3" sx={{ pb: 1 }}>
                Basic info
            </Typography>
            {selectedClient ? (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Selected Client: {selectedClient.name}
                    </Typography>
                    <Button variant="outlined" onClick={handleChangeClient} sx={{ mb: 2 }}>
                        Change Client
                    </Button>
                </Box>
            ) : (
                <Box sx={{ mb: 2 }}>
                    <ClientSearchAutocomplete />
                </Box>
            )}
            <FirstLastName readOnly={!!selectedClient} />
        </Box>
    )
}
