import { gql } from '@apollo/client'

export const CONFIRM_QUOTE_MUTATION = gql`
  mutation ConfirmQuote($quoteId: ID!, $amountSent: Float!) {
    confirmQuote(quoteId: $quoteId, amountSent: $amountSent) {
      success
      errors
      quoteExpired
      quote {
        id
        status
        sourceCurrency
        targetCurrency
        exchangeRate
        amountSent
        feeAmount
        amountReceived
        feeConfig {
          percentage
          fixedAmount
          currencyCode
        }
      }
    }
  }
`
