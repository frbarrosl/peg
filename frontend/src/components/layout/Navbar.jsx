import { useNavigate, Link } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import MuiButton from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Tooltip from '@mui/material/Tooltip'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            fontWeight={700}
            color="primary"
            sx={{ textDecoration: 'none' }}
          >
            Peg
          </Typography>
          <MuiButton component={Link} to="/" variant="text" size="small">
            Home
          </MuiButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAuthenticated ? (
            <>
              <MuiButton component={Link} to="/exchange" variant="text" size="small">
                Exchange
              </MuiButton>
              <MuiButton component={Link} to="/transactions" variant="text" size="small">
                My transactions
              </MuiButton>
              <Tooltip title="Profile">
                <IconButton component={Link} to="/profile" color="primary">
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
              <MuiButton variant="outlined" size="small" onClick={handleLogout}>
                Logout
              </MuiButton>
            </>
          ) : (
            <>
              <MuiButton component={Link} to="/login" variant="text" size="small">
                Login
              </MuiButton>
              <MuiButton component={Link} to="/register" variant="contained" size="small">
                Register
              </MuiButton>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
