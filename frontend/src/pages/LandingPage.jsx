import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MuiButton from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useAuth } from '../context/AuthContext'
import TideWave from '../components/common/TideWave'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 3,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <TideWave position="top" />
      <TideWave position="bottom" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          color="primary"
          gutterBottom
          sx={{ letterSpacing: '-0.5px' }}
        >
          Peg
        </Typography>

        <Typography
          variant="h5"
          fontWeight={400}
          color="text.secondary"
          sx={{ maxWidth: 480, mx: 'auto', mb: 1 }}
        >
          Simple, fast, and secure financial management.
        </Typography>

        <Typography
          variant="body1"
          color="text.disabled"
          sx={{ maxWidth: 400, mx: 'auto', mb: 5 }}
        >
          Track balances, monitor activity, and stay in control — all in one place.
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          {isAuthenticated ? (
            <>
              <MuiButton component={Link} to="/exchange" variant="contained" size="large" sx={{ px: 4 }}>
                Exchange
              </MuiButton>
              <MuiButton component={Link} to="/transactions" variant="outlined" size="large" sx={{ px: 4 }}>
                My transactions
              </MuiButton>
            </>
          ) : (
            <>
              <MuiButton component={Link} to="/register" variant="contained" size="large" sx={{ px: 4 }}>
                Get started
              </MuiButton>
              <MuiButton component={Link} to="/login" variant="outlined" size="large" sx={{ px: 4 }}>
                Sign in
              </MuiButton>
            </>
          )}
        </Stack>
      </motion.div>
    </Box>
  )
}
