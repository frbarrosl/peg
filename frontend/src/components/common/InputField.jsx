import TextField from '@mui/material/TextField'

export default function InputField({ label, type = 'text', value, onChange, error, placeholder }) {
  return (
    <TextField
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={Boolean(error)}
      helperText={error || ' '}
      fullWidth
      sx={{ mb: 1 }}
    />
  )
}
