import graphene
from graphene_django import DjangoObjectType

from .models import Article


class ArticleType(DjangoObjectType):
    class Meta:
        model = Article
        fields = ("id", "title", "content", "created_at")


class Query(graphene.ObjectType):
    all_articles = graphene.List(ArticleType)
    article = graphene.Field(ArticleType, id=graphene.ID(required=True))

    def resolve_all_articles(root, info):
        return Article.objects.all()

    def resolve_article(root, info, id):
        try:
            return Article.objects.get(pk=id)
        except Article.DoesNotExist:
            return None
