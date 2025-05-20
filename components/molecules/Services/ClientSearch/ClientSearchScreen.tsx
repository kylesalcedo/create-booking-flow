import React from 'react'
import WithLayout from 'components/atoms/layout/WithLayout'
import { ClientSearchAutocomplete } from 'components/molecules/Services/PersonalInfo/ClientSearchAutocomplete'
import { useClientValue } from 'lib/state/client'
import { Step } from 'lib/state/booking-flow/types'
import { useFlowStep } from 'lib/state/booking-flow'
import { Formik } from 'formik'

export default function ClientSearchScreen() {
    const selectedClient = useClientValue()
    console.log('ClientSearchScreen - selectedClient from Recoil:', selectedClient);
    const { setStep } = useFlowStep()

    const canContinue = !!selectedClient

    const handleContinue = async () => {
        console.log('ClientSearchScreen - handleContinue called. canContinue:', canContinue, 'selectedClient:', selectedClient);
        if (!canContinue) {
            console.log('ClientSearchScreen - handleContinue: cannot continue.');
            return;
        }
        try {
            console.log('ClientSearchScreen - handleContinue: attempting to set step to SelectService.');
            await setStep(Step.SelectService);
            console.log('ClientSearchScreen - handleContinue: setStep completed.');
        } catch (error) {
            console.error('ClientSearchScreen - handleContinue: error during setStep:', error);
        }
    }

    return (
        <Formik initialValues={{}} onSubmit={() => {}}>
            {() => (
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
            )}
        </Formik>
    )
} 