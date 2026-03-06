import graphene
import graphql_jwt

from users.schema import AuthMutation, UserQuery
from core.schema import Query as CoreQuery
from exchange.schema import ExchangeQuery, ExchangeMutation


class Query(UserQuery, CoreQuery, ExchangeQuery, graphene.ObjectType):
    pass


class Mutation(AuthMutation, ExchangeMutation, graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
