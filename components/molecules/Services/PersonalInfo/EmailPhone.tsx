import { useFormikContext } from 'formik'
import { Grid } from '@mui/material'
import MaskedInput from 'react-text-mask'
import { phoneMask } from 'constants/regexps'
import TextFieldBase from 'components/atoms/formik/TextFieldBase'
import { emailFieldName, phoneFieldName } from '../PersonalInfo/ts/constants'
import { forwardRef } from 'react'

// eslint-disable-next-line react/display-name
const TextMaskCustom = forwardRef((props: any, ref: any) => {
    return (
        <MaskedInput {...props} placeholder="(000) 000-0000" mask={phoneMask} />
    )
})

interface EmailPhoneProps {
    readOnly?: boolean
}

export default function EmailPhone({ readOnly }: EmailPhoneProps) {
    const { errors, touched } = useFormikContext<any>()

    return (
        <>
            <Grid item md={5} sm={12} xs={12}>
                <TextFieldBase
                    id={emailFieldName}
                    label="Email"
                    type="email"
                    error={!!(errors[emailFieldName] && touched[emailFieldName])}
                    helperText={touched[emailFieldName] && errors[emailFieldName] ? String(errors[emailFieldName]) : ''}
                    InputProps={{
                        readOnly: readOnly,
                    }}
                />
            </Grid>
            <Grid item md={4} sm={12} xs={12}>
                <TextFieldBase
                    id={phoneFieldName}
                    label="Phone"
                    type="tel"
                    InputProps={{
                        inputComponent: TextMaskCustom as any,
                        readOnly: readOnly,
                    }}
                    error={!!(errors[phoneFieldName] && touched[phoneFieldName])}
                    helperText={touched[phoneFieldName] && errors[phoneFieldName] ? String(errors[phoneFieldName]) : ''}
                />
            </Grid>
        </>
    )
}
