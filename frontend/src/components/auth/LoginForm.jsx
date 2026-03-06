import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { LOGIN_MUTATION } from '../../graphql/mutations/LOGIN'
import { useAuth } from '../../context/AuthContext'
import InputField from '../common/InputField'
import Button from '../common/Button'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [fields, setFields] = useState({ username: '', password: '' })
  const [serverError, setServerError] = useState(null)

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted(data) {
      authLogin(data.tokenAuth.token)
      navigate('/')
    },
    onError(error) {
      setServerError(error.message)
    },
  })

  function handleChange(field) {
    return (e) => setFields((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setServerError(null)
    login({ variables: { username: fields.username, password: fields.password } })
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
          placeholder="Enter your username"
        />
        <InputField
          label="Password"
          type="password"
          value={fields.password}
          onChange={handleChange('password')}
          placeholder="Enter your password"
        />
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        <Button type="submit" loading={loading}>
          Sign In
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#0052FF', textDecoration: 'none', fontWeight: 500 }}>
            Register
          </Link>
        </Typography>
      </Box>
    </motion.div>
  )
}
