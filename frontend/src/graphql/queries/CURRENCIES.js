import { gql } from '@apollo/client'

export const GET_CURRENCIES = gql`
  query GetCurrencies {
    currencies {
      code
      name
    }
  }
`
