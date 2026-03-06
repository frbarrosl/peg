import { gql } from '@apollo/client'

export const GET_MY_TRANSACTIONS = gql`
  query MyTransactions {
    myTransactions {
      id
      status
      sourceCurrency
      targetCurrency
      exchangeRate
      amountSent
      feeAmount
      amountReceived
      createdAt
      feeConfig {
        percentage
        fixedAmount
        currencyCode
      }
    }
  }
`
