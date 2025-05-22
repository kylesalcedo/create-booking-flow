import { useFormikContext } from 'formik'
import { Grid } from '@mui/material'
import TextFieldBase from 'components/atoms/formik/TextFieldBase'
import {
    firstNameFieldName,
    lastNameFieldName,
} from '../PersonalInfo/ts/constants'

interface FirstLastNameProps {
    readOnly?: boolean
}

export default function FirstLastName({ readOnly }: FirstLastNameProps) {
    const { errors, touched } = useFormikContext<any>()

    return (
        <Grid item md={6} sm={12} xs={12}>
            <TextFieldBase
                id={firstNameFieldName}
                label="First Name"
                fullWidth
                error={!!(errors[firstNameFieldName] && touched[firstNameFieldName])}
                helperText={touched[firstNameFieldName] && errors[firstNameFieldName] ? String(errors[firstNameFieldName]) : ''}
                InputProps={{
                    readOnly: readOnly,
                }}
            />
            <TextFieldBase
                id={lastNameFieldName}
                label="Last Name"
                error={!!(errors[lastNameFieldName] && touched[lastNameFieldName])}
                helperText={touched[lastNameFieldName] && errors[lastNameFieldName] ? String(errors[lastNameFieldName]) : ''}
                InputProps={{
                    readOnly: readOnly,
                }}
            />
        </Grid>
    )
}
