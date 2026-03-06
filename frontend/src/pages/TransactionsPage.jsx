import { useQuery } from '@apollo/client/react'
import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { GET_MY_TRANSACTIONS } from '../graphql/queries/MY_TRANSACTIONS'

export default function TransactionsPage() {
  const { data, loading, error } = useQuery(GET_MY_TRANSACTIONS, { fetchPolicy: 'network-only' })
  const transactions = data?.myTransactions ?? []

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        My Transactions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Your completed exchange history
      </Typography>

      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>
          Loading transactions...
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}

      {!loading && !error && transactions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>
          No transactions yet. Complete an exchange to see it here.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {transactions.map((tx, index) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.07, ease: 'easeOut' }}
          >
            <QuoteCard transaction={tx} />
          </motion.div>
        ))}
      </Box>
    </Box>
  )
}

function QuoteCard({ transaction }) {
  const {
    sourceCurrency, targetCurrency,
    exchangeRate, amountSent, feeAmount, amountReceived,
    createdAt, feeConfig,
  } = transaction

  const rate = parseFloat(exchangeRate)
  const sent = parseFloat(amountSent)
  const fee = parseFloat(feeAmount)
  const received = parseFloat(amountReceived)

  const dateLabel = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

        {/* Header row: currencies + status + date */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              {sourceCurrency}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              {targetCurrency}
            </Typography>
            <Chip
              label={transaction.status}
              size="small"
              color={transaction.status === 'COMPLETED' ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="text.disabled">
            {dateLabel}
          </Typography>
        </Box>

        {/* Amounts row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
              {sent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {' '}
              <Typography component="span" variant="body2" color="text.secondary" fontWeight={500}>
                {sourceCurrency}
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You sent
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" fontWeight={700} color="success.main" lineHeight={1.2}>
              {received.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {' '}
              <Typography component="span" variant="body2" color="success.main" fontWeight={500}>
                {targetCurrency}
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recipient got
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Footer: rate + fee */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            1 {sourceCurrency} = {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {targetCurrency}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fee{' '}
            {feeConfig && (
              <Typography component="span" variant="caption" color="text.disabled">
                ({feeConfig.percentage}% + {feeConfig.fixedAmount} {feeConfig.currencyCode})
              </Typography>
            )}
            {' '}
            <Typography component="span" variant="caption" fontWeight={600}>
              {fee.toLocaleString(undefined, { maximumFractionDigits: 2 })} {sourceCurrency}
            </Typography>
          </Typography>
        </Box>

      </CardContent>
    </Card>
  )
}
