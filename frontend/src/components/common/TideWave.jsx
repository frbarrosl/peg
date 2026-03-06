import { motion } from 'framer-motion'
import Box from '@mui/material/Box'

export default function TideWave({ position = 'top' }) {
  const isBottom = position === 'bottom'
  return (
    <Box sx={{
      position: 'absolute',
      [isBottom ? 'bottom' : 'top']: 0,
      left: 0, right: 0,
      height: 160,
      overflow: 'hidden',
      pointerEvents: 'none',
      WebkitMaskImage: isBottom
        ? 'linear-gradient(to top, black 50%, transparent 100%)'
        : 'linear-gradient(to bottom, black 50%, transparent 100%)',
      maskImage: isBottom
        ? 'linear-gradient(to top, black 50%, transparent 100%)'
        : 'linear-gradient(to bottom, black 50%, transparent 100%)',
    }}>
      <motion.div
        animate={{ x: isBottom ? ['0%', '-25%'] : ['-25%', '0%'] }}
        transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        style={{
          width: '150%',
          height: '200%',
          background: 'radial-gradient(ellipse, rgba(0,82,255,0.14) 0%, transparent 70%)',
          borderRadius: '50%',
          position: 'absolute',
          [isBottom ? 'bottom' : 'top']: 0,
        }}
      />
    </Box>
  )
}
