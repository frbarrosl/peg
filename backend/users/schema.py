import graphene
from django.contrib.auth import get_user_model

User = get_user_model()


class UserType(graphene.ObjectType):
    id = graphene.ID()
    username = graphene.String()
    email = graphene.String()


class RegisterMutation(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    user = graphene.Field(UserType)

    def mutate(self, info, username, email, password):
        if User.objects.filter(username=username).exists():
            return RegisterMutation(success=False, errors=["Username is not available."])
        if User.objects.filter(email=email).exists():
            return RegisterMutation(success=False, errors=["Email is not available."])

        user = User.objects.create_user(username=username, email=email, password=password)
        return RegisterMutation(
            success=True,
            errors=None,
            user=UserType(id=user.id, username=user.username, email=user.email),
        )


class UserQuery(graphene.ObjectType):
    me = graphene.Field(UserType)

    def resolve_me(root, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return UserType(id=user.id, username=user.username, email=user.email)


class AuthMutation(graphene.ObjectType):
    register = RegisterMutation.Field()
