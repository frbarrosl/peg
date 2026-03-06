import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { NumericFormat } from 'react-number-format'
import { motion, AnimatePresence } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import MuiButton from '@mui/material/Button'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { GET_CURRENCIES } from '../graphql/queries/CURRENCIES'
import { REQUEST_QUOTE_MUTATION } from '../graphql/mutations/REQUEST_QUOTE'
import { CONFIRM_QUOTE_MUTATION } from '../graphql/mutations/CONFIRM_QUOTE'
import { UPDATE_DRAFT_QUOTE_MUTATION } from '../graphql/mutations/UPDATE_DRAFT_QUOTE'
import { useDebounce } from '../hooks/useDebounce'

export default function ExchangePage() {
  const [sourceCurrency, setSourceCurrency] = useState(null)
  const [targetCurrency, setTargetCurrency] = useState(null)
  const [activeQuote, setActiveQuote] = useState(null)
  const [amountLeft, setAmountLeft] = useState('')
  const [amountRight, setAmountRight] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmedQuote, setConfirmedQuote] = useState(null)
  const [quoteError, setQuoteError] = useState(null)
  const [rateRefreshed, setRateRefreshed] = useState(false)

  const { data: currencyData, loading: currenciesLoading } = useQuery(GET_CURRENCIES)
  const currencies = currencyData?.currencies ?? []

  const debouncedAmountLeft = useDebounce(amountLeft, 1000)

  const [updateDraftQuote] = useMutation(UPDATE_DRAFT_QUOTE_MUTATION)

  useEffect(() => {
    const amount = parseFloat(debouncedAmountLeft)
    if (!activeQuote || !debouncedAmountLeft || isNaN(amount) || amount <= 0) return
    updateDraftQuote({ variables: { quoteId: activeQuote.id, amountSent: amount } })
  }, [debouncedAmountLeft, activeQuote])

  const [requestQuote, { loading: quoteLoading }] = useMutation(REQUEST_QUOTE_MUTATION, {
    onCompleted(data) {
      if (data.requestQuote.success) {
        setActiveQuote(data.requestQuote.quote)
        setAmountLeft('')
        setAmountRight('')
        setQuoteError(null)
      } else {
        setQuoteError(data.requestQuote.errors?.join(' ') ?? 'Failed to fetch quote.')
      }
    },
    onError(err) {
      setQuoteError(err.message)
    },
  })

  const [confirmQuote, { loading: confirmLoading }] = useMutation(CONFIRM_QUOTE_MUTATION, {
    onCompleted(data) {
      if (data.confirmQuote.quoteExpired) {
        setActiveQuote(data.confirmQuote.quote)
        setRateRefreshed(true)
        return
      }
      if (data.confirmQuote.success) {
        setConfirmedQuote(data.confirmQuote.quote)
        setRateRefreshed(false)
      } else {
        setQuoteError(data.confirmQuote.errors?.join(' ') ?? 'Confirmation failed.')
        setModalOpen(false)
      }
    },
    onError(err) {
      setQuoteError(err.message)
      setModalOpen(false)
    },
  })

  function handleSourceChange(_, value) {
    setSourceCurrency(value)
    setActiveQuote(null)
    setAmountLeft('')
    setAmountRight('')
    if (value && targetCurrency) {
      requestQuote({ variables: { sourceCurrency: value.code, targetCurrency: targetCurrency.code } })
    }
  }

  function handleTargetChange(_, value) {
    setTargetCurrency(value)
    setActiveQuote(null)
    setAmountLeft('')
    setAmountRight('')
    if (sourceCurrency && value) {
      requestQuote({ variables: { sourceCurrency: sourceCurrency.code, targetCurrency: value.code } })
    }
  }

  function handleLeftChange(values, sourceInfo) {
    if (sourceInfo?.source !== 'event') return
    const val = values.floatValue ?? ''
    setAmountLeft(val === '' ? '' : String(val))
    if (val !== '' && activeQuote) {
      const rate = parseFloat(activeQuote.exchangeRate)
      setAmountRight(String((val * rate).toFixed(2)))
    } else {
      setAmountRight('')
    }
  }

  function handleRightChange(values, sourceInfo) {
    if (sourceInfo?.source !== 'event') return
    const val = values.floatValue ?? ''
    setAmountRight(val === '' ? '' : String(val))
    if (val !== '' && activeQuote) {
      const rate = parseFloat(activeQuote.exchangeRate)
      setAmountLeft(String((val / rate).toFixed(8)))
    } else {
      setAmountLeft('')
    }
  }

  function handleOpenModal() {
    setConfirmedQuote(null)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setRateRefreshed(false)
    if (confirmedQuote) {
      setActiveQuote(null)
      setSourceCurrency(null)
      setTargetCurrency(null)
      setAmountLeft('')
      setAmountRight('')
      setConfirmedQuote(null)
    }
  }

  function handleConfirm() {
    confirmQuote({
      variables: { quoteId: activeQuote.id, amountSent: parseFloat(amountLeft) },
    })
  }

  const rate = activeQuote ? parseFloat(activeQuote.exchangeRate) : null
  const fee = activeQuote?.feeConfig
    ? { pct: parseFloat(activeQuote.feeConfig.percentage), fixed: parseFloat(activeQuote.feeConfig.fixedAmount), code: activeQuote.feeConfig.currencyCode }
    : null

  const estimatedFeeAmount = fee && amountLeft
    ? (parseFloat(amountLeft) * fee.pct / 100) + fee.fixed
    : null
  const estimatedReceived = estimatedFeeAmount !== null && rate
    ? (parseFloat(amountLeft) - estimatedFeeAmount) * rate
    : null

  const canConfirm = activeQuote && amountLeft && parseFloat(amountLeft) > 0

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Request Exchange
      </Typography>

      {/* Sticky subtitle */}
      <Box
        sx={{
          position: 'sticky',
          top: 64,
          bgcolor: 'background.default',
          zIndex: 10,
          py: 1,
          mb: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Get a live rate and send instantly
        </Typography>
      </Box>

      {/* Selector row */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Left selector */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1, display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}
          >
            Currency I have
          </Typography>
          <Autocomplete
            options={currencies}
            getOptionLabel={(o) => `${o.code} — ${o.name}`}
            value={sourceCurrency}
            onChange={handleSourceChange}
            loading={currenciesLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Currency"
                variant="filled"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {currenciesLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Center: arrows + rate/fee info */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 4,
            minWidth: 120,
            gap: 1,
          }}
        >
          {quoteLoading ? (
            <CircularProgress size={28} />
          ) : (
            <SwapHorizIcon color="primary" sx={{ fontSize: 32 }} />
          )}

          <AnimatePresence>
            {activeQuote && !quoteLoading && (
              <motion.div
                key="rate-info"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ textAlign: 'center' }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  fontWeight={600}
                  sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem' }}
                >
                  1 {sourceCurrency?.code} = {parseFloat(activeQuote.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 4 })} {targetCurrency?.code}
                </Typography>
                {fee && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Fee {fee.pct}% + {fee.fixed} {fee.code}
                  </Typography>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Right selector */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1, display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase' }}
          >
            Currency I want to send
          </Typography>
          <Autocomplete
            options={currencies}
            getOptionLabel={(o) => `${o.code} — ${o.name}`}
            value={targetCurrency}
            onChange={handleTargetChange}
            loading={currenciesLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Currency"
                variant="filled"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {currenciesLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
      </Box>

      {/* Quote error */}
      {quoteError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setQuoteError(null)}>
          {quoteError}
        </Alert>
      )}

      {/* Amount inputs */}
      <AnimatePresence>
        {activeQuote && (
          <motion.div
            key="amount-row"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 3 }}>
              <Box sx={{ flex: 1 }}>
                <NumericFormat
                  value={amountLeft}
                  onValueChange={handleLeftChange}
                  thousandSeparator
                  decimalScale={8}
                  allowNegative={false}
                  customInput={TextField}
                  label={sourceCurrency?.code ?? 'Amount'}
                  variant="filled"
                  fullWidth
                  placeholder="0.00"
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Box>
              <Box sx={{ minWidth: 120 }} />
              <Box sx={{ flex: 1 }}>
                <NumericFormat
                  value={amountRight}
                  onValueChange={handleRightChange}
                  thousandSeparator
                  decimalScale={2}
                  allowNegative={false}
                  customInput={TextField}
                  label={targetCurrency?.code ?? 'Amount'}
                  variant="filled"
                  fullWidth
                  placeholder="0.00"
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Box>
            </Box>

            {canConfirm && (
              <Box sx={{ mt: 3 }}>
                <MuiButton
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleOpenModal}
                  sx={{ py: 1.5 }}
                >
                  Confirm transaction
                </MuiButton>
              </Box>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal */}
      <Dialog open={modalOpen} onClose={confirmedQuote ? handleCloseModal : undefined} maxWidth="xs" fullWidth>
        {confirmedQuote ? (
          // Confirmed state
          <>
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', display: 'block', mx: 'auto', mb: 1 }} />
              Transaction Confirmed
            </DialogTitle>
            <DialogContent>
              <SummaryRow label="You sent" value={`${parseFloat(confirmedQuote.amountSent).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${confirmedQuote.sourceCurrency}`} />
              <SummaryRow label="Fee" value={`${parseFloat(confirmedQuote.feeAmount).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${confirmedQuote.sourceCurrency}`} />
              <Divider sx={{ my: 1 }} />
              <SummaryRow label="Recipient gets" value={`${parseFloat(confirmedQuote.amountReceived).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${confirmedQuote.targetCurrency}`} bold />
              <SummaryRow
                label="Final rate"
                value={`1 ${confirmedQuote.sourceCurrency} = ${parseFloat(confirmedQuote.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${confirmedQuote.targetCurrency}`}
                mono
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <MuiButton variant="contained" fullWidth onClick={handleCloseModal}>
                Done
              </MuiButton>
            </DialogActions>
          </>
        ) : (
          // Preview state
          <>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogContent>
              {rateRefreshed && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  The rate expired and has been refreshed. Please review the new rate before confirming.
                </Alert>
              )}
              <SummaryRow label="You send" value={`${parseFloat(amountLeft).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${sourceCurrency?.code}`} />
              {estimatedFeeAmount !== null && (
                <SummaryRow label="Est. fee" value={`${estimatedFeeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${sourceCurrency?.code}`} />
              )}
              <Divider sx={{ my: 1 }} />
              {estimatedReceived !== null && (
                <SummaryRow label="Est. recipient gets" value={`${estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${targetCurrency?.code}`} bold />
              )}
              <SummaryRow
                label="Current rate"
                value={`1 ${sourceCurrency?.code} = ${rate?.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${targetCurrency?.code}`}
                mono
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <MuiButton variant="outlined" onClick={() => setModalOpen(false)} disabled={confirmLoading}>
                Cancel
              </MuiButton>
              <MuiButton
                variant="contained"
                onClick={handleConfirm}
                disabled={confirmLoading}
                startIcon={confirmLoading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {confirmLoading ? 'Loading...' : 'Confirm'}
              </MuiButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

function SummaryRow({ label, value, bold = false, mono = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 700 : 500}
        sx={mono ? { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' } : {}}
      >
        {value}
      </Typography>
    </Box>
  )
}
