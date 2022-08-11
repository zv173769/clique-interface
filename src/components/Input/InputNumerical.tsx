import { InputHTMLAttributes, useCallback } from 'react'
import { Box, Typography } from '@mui/material'
import Input, { InputProps } from './index'
import { escapeRegExp } from 'utils'
import InputLabel from './InputLabel'

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export default function NumericalInput({
  placeholder,
  onChange,
  maxWidth,
  onMax,
  balance,
  label,
  unit,
  ...props
}: InputProps & InputHTMLAttributes<HTMLInputElement> & { onMax?: () => void; balance?: string; unit?: string }) {
  const enforcer = (nextUserInput: string) => {
    const fixed = nextUserInput.replace(/,/g, '.')
    if (fixed === '' || inputRegex.test(escapeRegExp(fixed))) {
      return fixed
    }
    return null
  }
  const handleChange = useCallback(
    event => {
      // replace commas with periods
      const formatted = enforcer(event.target.value)
      if (formatted === null) {
        return
      }
      event.target.value = formatted
      onChange && onChange(event)
    },
    [onChange]
  )

  return (
    <Box sx={{ position: 'relative', maxWidth: maxWidth ?? 'unset', width: '100%' }}>
      {(label || balance) && (
        <Box display="flex" justifyContent="space-between" padding="0 15px">
          <InputLabel>{label}</InputLabel>
          {!!balance && (
            <InputLabel>
              Balance: {balance} {unit ?? 'MATTER'}
            </InputLabel>
          )}
        </Box>
      )}
      <Input
        {...props} // universal input options
        maxWidth={maxWidth}
        onChange={handleChange}
        inputMode="decimal"
        title=""
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder={placeholder || '0.0'}
        minLength={1}
        maxLength={79}
        spellCheck="false"
        endAdornment={
          onMax && (
            <Box display="flex" gap="5px" alignItems="center" paddingLeft="20px">
              <Box
                sx={{
                  background: '#F0F3F6',
                  borderRadius: '10px',
                  width: 50,
                  height: 20,
                  textAlign: 'center',
                  color: '#0062DF',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
                onClick={onMax}
              >
                MAX
              </Box>
              {unit && (
                <>
                  <Typography color="#B2B3BD">|</Typography>
                  <Typography fontWeight={600} fontSize="14px">
                    {unit}
                  </Typography>
                </>
              )}
            </Box>
          )
        }
      />
    </Box>
  )
}
