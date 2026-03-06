import { gql } from '@apollo/client'

export const REQUEST_QUOTE_MUTATION = gql`
  mutation RequestQuote($sourceCurrency: String!, $targetCurrency: String!) {
    requestQuote(sourceCurrency: $sourceCurrency, targetCurrency: $targetCurrency) {
      success
      errors
      quote {
        id
        exchangeRate
        sourceCurrency
        targetCurrency
        feeConfig {
          percentage
          fixedAmount
          currencyCode
        }
      }
    }
  }
`
