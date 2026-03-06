import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import { ME_QUERY } from '../graphql/queries/ME'

export default function ProfilePage() {
  const { data, loading, error } = useQuery(ME_QUERY)

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', px: 2, py: 6 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Profile
      </Typography>

      {loading && <ProfileSkeleton />}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      {data?.me && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    fontSize: 28,
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {data.me.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight={600}>
                  {data.me.username}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <ProfileRow label="Username" value={data.me.username} />
              <ProfileRow label="Email" value={data.me.email} />
              <ProfileRow label="ID" value={`#${data.me.id}`} mono />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  )
}

function ProfileRow({ label, value, mono = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        sx={mono ? { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' } : {}}
      >
        {value}
      </Typography>
    </Box>
  )
}

function ProfileSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={72} height={72} sx={{ mb: 2 }} />
          <Skeleton width={120} height={28} />
        </Box>
        <Divider sx={{ mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
            <Skeleton width={80} />
            <Skeleton width={140} />
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}
