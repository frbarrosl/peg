import { gql } from '@apollo/client'

export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      success
      errors
      user {
        id
        username
        email
      }
    }
  }
`
