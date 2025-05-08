import React, { useState } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import { useClientSearch } from 'lib/hooks/useClientSearch'
import { useFormikContext } from 'formik'
import { firstNameFieldName, lastNameFieldName, emailFieldName, phoneFieldName } from './ts/constants'
import { useSetSelectedClientState } from 'lib/state/client'

interface ClientOption {
    id: string
    name: string
    email?: string
    mobilePhone?: string
}

export const ClientSearchAutocomplete = () => {
    const [inputValue, setInputValue] = useState('')
    const { loading, results } = useClientSearch(inputValue)
    const { setFieldValue } = useFormikContext<any>()
    const setSelectedClient = useSetSelectedClientState()

    const handleSelect = (_: any, value: ClientOption | null) => {
        if (!value) return
        const [first, ...rest] = (value.name ?? '').split(' ')
        setFieldValue(firstNameFieldName, first)
        setFieldValue(lastNameFieldName, rest.join(' '))
        if (value.email) setFieldValue(emailFieldName, value.email)
        if (value.mobilePhone) setFieldValue(phoneFieldName, value.mobilePhone)
        setSelectedClient(value)
    }

    return (
        <Autocomplete
            options={results}
            getOptionLabel={(option) =>
                option.name + (option.mobilePhone ? ` - ${option.mobilePhone}` : '')
            }
            onInputChange={(_, val) => setInputValue(val)}
            onChange={handleSelect}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search existing client"
                    placeholder="Name, email, or phone"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
        />
    )
} 