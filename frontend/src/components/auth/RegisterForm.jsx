import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { REGISTER_MUTATION } from '../../graphql/mutations/REGISTER'
import InputField from '../common/InputField'
import Button from '../common/Button'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({ username: '', email: '', password: '' })
  const [serverErrors, setServerErrors] = useState([])

  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted(data) {
      if (data.register.success) {
        navigate('/login')
      } else {
        setServerErrors(data.register.errors || ['Registration failed.'])
      }
    },
    onError(error) {
      setServerErrors([error.message])
    },
  })

  function handleChange(field) {
    return (e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setServerErrors([])
    register({ variables: fields })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <InputField
          label="Username"
          value={fields.username}
          onChange={handleChange('username')}
          placeholder="Choose a username"
        />
        <InputField
          label="Email"
          type="email"
          value={fields.email}
          onChange={handleChange('email')}
          placeholder="Enter your email"
        />
        <InputField
          label="Password"
          type="password"
          value={fields.password}
          onChange={handleChange('password')}
          placeholder="Create a password"
        />
        {serverErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverErrors.join(' ')}
          </Alert>
        )}
        <Button type="submit" loading={loading}>
          Create Account
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0052FF', textDecoration: 'none', fontWeight: 500 }}>
            Sign In
          </Link>
        </Typography>
      </Box>
    </motion.div>
  )
}
