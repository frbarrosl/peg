import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <Paper elevation={1} sx={{ p: 5, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>
          <LoginForm />
        </Paper>
      </motion.div>
    </Box>
  )
}
