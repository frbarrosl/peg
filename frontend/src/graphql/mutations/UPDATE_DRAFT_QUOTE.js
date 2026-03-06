import { gql } from '@apollo/client'

export const UPDATE_DRAFT_QUOTE_MUTATION = gql`
  mutation UpdateDraftQuote($quoteId: ID!, $amountSent: Float!) {
    updateDraftQuote(quoteId: $quoteId, amountSent: $amountSent) {
      success
      errors
      quote {
        id
        amountSent
      }
    }
  }
`
