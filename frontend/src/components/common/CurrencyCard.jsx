import { motion } from 'framer-motion'
import { NumericFormat } from 'react-number-format'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

/**
 * CurrencyCard
 *
 * Props:
 *   currency     {string}   Currency code, e.g. "BTC"
 *   symbol       {string}   Display symbol, e.g. "₿"
 *   balance      {number}   Current balance value
 *   change       {number}   % change (positive = green, negative = red)
 *   sparklineData {Array}   Array of { value: number } for the sparkline
 */
export default function CurrencyCard({ currency, symbol, balance, change, sparklineData = [] }) {
  const isPositive = change >= 0
  const trendColor = isPositive ? '#00C853' : '#FF3B30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} letterSpacing={1}>
                {currency}
              </Typography>

              <Typography
                variant="h5"
                fontWeight={600}
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                  mt: 0.5,
                  mb: 0.5,
                }}
              >
                <NumericFormat
                  value={balance}
                  displayType="text"
                  thousandSeparator
                  decimalScale={2}
                  fixedDecimalScale
                  prefix={symbol ? `${symbol} ` : '$'}
                />
              </Typography>

              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  color: trendColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </Typography>
            </Box>

            {sparklineData.length > 0 && (
              <Box sx={{ width: 100, height: 48 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={trendColor}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}
