import React from 'react'
import WithLayout from 'components/atoms/layout/WithLayout'
import { ClientSearchAutocomplete } from 'components/molecules/Services/PersonalInfo/ClientSearchAutocomplete'
import { useClientValue } from 'lib/state/client'
import { Step } from 'lib/state/booking-flow/types'
import { useFlowStep } from 'lib/state/booking-flow'

export default function ClientSearchScreen() {
    const selectedClient = useClientValue()
    const { setStep } = useFlowStep()

    const canContinue = !!selectedClient

    const handleContinue = async () => {
        if (!canContinue) return
        await setStep(Step.SelectService)
    }

    return (
        <WithLayout
            isShowLoader={false}
            leftPanel={<></>}
            rightPanel={<ClientSearchAutocomplete />}
            rightPanelCaption="Search Client"
            rightPanelBtnCaption="Continue"
            showBottom={true}
            addBackArrow={true}
            backArrowStep={Step.ChooseLocation}
            onRightPanelBtnClick={handleContinue}
        />
    )
} 