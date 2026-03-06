import graphene
from graphene_django import DjangoObjectType

from .models import Currency, FeeConfig, Quote
from .services import create_draft_quote, confirm_quote


class CurrencyType(DjangoObjectType):
    class Meta:
        model = Currency
        fields = ('code', 'name')


class FeeConfigType(DjangoObjectType):
    class Meta:
        model = FeeConfig
        fields = ('id', 'name', 'percentage', 'fixed_amount', 'currency_code')
        convert_choices_to_enum = False


class QuoteType(DjangoObjectType):
    fee_config = graphene.Field(FeeConfigType)

    class Meta:
        model = Quote
        fields = (
            'id', 'source_currency', 'target_currency', 'exchange_rate',
            'amount_sent', 'fee_amount', 'amount_received', 'status', 'created_at',
        )
        convert_choices_to_enum = False

    def resolve_fee_config(root, info):
        return root.fee_config


class ExchangeQuery(graphene.ObjectType):
    currencies = graphene.List(CurrencyType)
    my_transactions = graphene.List(QuoteType)

    def resolve_currencies(root, info):
        return Currency.objects.all()

    def resolve_my_transactions(root, info):
        user = info.context.user
        if user.is_anonymous:
            return []
        return Quote.objects.filter(
            user=user,
            status__in=[Quote.Status.COMPLETED, Quote.Status.PENDING]
        ).order_by('-created_at')


class RequestQuoteMutation(graphene.Mutation):
    class Arguments:
        source_currency = graphene.String(required=True)
        target_currency = graphene.String(required=True)

    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    quote = graphene.Field(QuoteType)

    def mutate(self, info, source_currency, target_currency):
        user = info.context.user
        if user.is_anonymous:
            return RequestQuoteMutation(success=False, errors=["Authentication required."])
        try:
            quote = create_draft_quote(user, source_currency, target_currency)
            return RequestQuoteMutation(success=True, quote=quote, errors=None)
        except Exception as e:
            return RequestQuoteMutation(success=False, errors=[str(e)])


class ConfirmQuoteMutation(graphene.Mutation):
    class Arguments:
        quote_id = graphene.ID(required=True)
        amount_sent = graphene.Float(required=True)

    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    quote = graphene.Field(QuoteType)
    quote_expired = graphene.Boolean()

    def mutate(self, info, quote_id, amount_sent):
        user = info.context.user
        if user.is_anonymous:
            return ConfirmQuoteMutation(success=False, errors=["Authentication required."])
        try:
            quote = Quote.objects.get(id=quote_id, user=user, status=Quote.Status.DRAFT)
        except Quote.DoesNotExist:
            return ConfirmQuoteMutation(success=False, errors=["Quote not found."])
        try:
            updated, expired = confirm_quote(quote, amount_sent)
            if expired:
                new_draft = create_draft_quote(user, quote.source_currency, quote.target_currency)
                return ConfirmQuoteMutation(success=False, quote=new_draft, quote_expired=True, errors=None)
            return ConfirmQuoteMutation(success=True, quote=updated, quote_expired=False, errors=None)
        except Exception as e:
            return ConfirmQuoteMutation(success=False, errors=[str(e)])


class UpdateDraftQuoteMutation(graphene.Mutation):
    class Arguments:
        quote_id = graphene.ID(required=True)
        amount_sent = graphene.Float(required=True)

    success = graphene.Boolean()
    errors = graphene.List(graphene.String)
    quote = graphene.Field(QuoteType)

    def mutate(self, info, quote_id, amount_sent):
        user = info.context.user
        if user.is_anonymous:
            return UpdateDraftQuoteMutation(success=False, errors=["Authentication required."])
        try:
            quote = Quote.objects.get(id=quote_id, user=user, status=Quote.Status.DRAFT)
        except Quote.DoesNotExist:
            return UpdateDraftQuoteMutation(success=False, errors=["Draft quote not found."])
        quote.amount_sent = amount_sent
        quote.save(update_fields=['amount_sent'])
        return UpdateDraftQuoteMutation(success=True, quote=quote, errors=None)


class ExchangeMutation(graphene.ObjectType):
    request_quote = RequestQuoteMutation.Field()
    confirm_quote = ConfirmQuoteMutation.Field()
    update_draft_quote = UpdateDraftQuoteMutation.Field()
