import React, { useContext, useEffect } from 'react'
import { useFormikContext } from 'formik'
import { Box } from '@mui/material'
import { useCartState } from 'lib/state/cart'
import { LayoutContext } from 'components/atoms/layout/LayoutContext'
import BasicInfo from 'components/molecules/Services/PersonalInfo/BasicInfo'
import ContactInfo from 'components/molecules/Services/PersonalInfo/ContactInfo'
import AdditionalInfo from 'components/molecules/Services/PersonalInfo/AdditionalInfo'
import { useMobile } from 'lib/utils/useMobile'
import { theme } from 'styles/theme'
import { useClientValue } from 'lib/state/client'

export default function YourInfoForm() {
    const { isMobile } = useMobile()
    const cartState = useCartState()
    const { handleSubmit } = useFormikContext()
    const layout = useContext(LayoutContext)
    const selectedClient = useClientValue()

    useEffect(() => {
        layout.setOnRightPanelBtnClick(() => {
            handleSubmit()
        })
        // eslint-disable-next-line
    }, [])

    return (
        <Box sx={{
            padding: !isMobile ? 5 : theme.spacing(3, 4, 10, 5),
            height: 'calc(100% - 57px)',
            overflowY: 'scroll',
            position: 'sticky',
            '&::-webkit-scrollbar': {
                display: 'none',
            },
        }}>
            <BasicInfo />
            <ContactInfo readOnly={!!selectedClient} />
            {!!cartState?.bookingQuestions.length && <AdditionalInfo />}
        </Box>
    )
}
