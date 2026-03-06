import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import RegisterForm from '../components/auth/RegisterForm'

export default function RegisterPage() {
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
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Get started for free
          </Typography>
          <RegisterForm />
        </Paper>
      </motion.div>
    </Box>
  )
}
