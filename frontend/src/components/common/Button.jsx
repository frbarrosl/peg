import MuiButton from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

export default function Button({
  children,
  loading = false,
  type = 'button',
  onClick,
  disabled,
  variant = 'contained',
  color = 'primary',
  fullWidth = true,
}) {
  return (
    <MuiButton
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      sx={{ py: 1.5 }}
    >
      {loading ? 'Loading...' : children}
    </MuiButton>
  )
}
