"""
GraphQL integration tests for the users app (register + login + me query).
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from django.contrib.auth import get_user_model

from conftest import gql, get_jwt_token

User = get_user_model()

# ---------------------------------------------------------------------------
# GraphQL strings
# ---------------------------------------------------------------------------

REGISTER = """
mutation($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
        success
        errors
        user { id username email }
    }
}
"""

TOKEN_AUTH = """
mutation($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
        token
    }
}
"""

ME_QUERY = """
query {
    me {
        id
        username
        email
    }
}
"""

# ---------------------------------------------------------------------------
# register mutation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_register_success(client):
    result = gql(client, REGISTER, {
        "username": "newuser",
        "email": "new@example.com",
        "password": "strongpass123",
    })
    data = result["data"]["register"]
    assert data["success"] is True
    assert data["errors"] is None
    assert data["user"]["username"] == "newuser"
    assert data["user"]["email"] == "new@example.com"
    assert User.objects.filter(username="newuser").exists()


@pytest.mark.django_db
def test_register_duplicate_username(client, user):
    result = gql(client, REGISTER, {
        "username": "testuser",  # already exists via user fixture
        "email": "different@example.com",
        "password": "strongpass123",
    })
    data = result["data"]["register"]
    assert data["success"] is False
    assert any("Username" in e for e in data["errors"])


@pytest.mark.django_db
def test_register_duplicate_email(client, user):
    result = gql(client, REGISTER, {
        "username": "differentuser",
        "email": "test@example.com",  # already exists via user fixture
        "password": "strongpass123",
    })
    data = result["data"]["register"]
    assert data["success"] is False
    assert any("Email" in e for e in data["errors"])


# ---------------------------------------------------------------------------
# tokenAuth (login)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_login_success(client, user):
    result = gql(client, TOKEN_AUTH, {"username": "testuser", "password": "testpass123"})
    token = result["data"]["tokenAuth"]["token"]
    assert token is not None
    assert len(token) > 10


@pytest.mark.django_db
def test_login_wrong_password(client, user):
    result = gql(client, TOKEN_AUTH, {"username": "testuser", "password": "wrongpass"})
    # graphql_jwt returns an error in the errors array, not in data
    assert result.get("errors") or result["data"]["tokenAuth"] is None


# ---------------------------------------------------------------------------
# me query
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_me_query_authenticated(client, user):
    token = get_jwt_token(client)
    result = gql(client, ME_QUERY, headers={"HTTP_AUTHORIZATION": f"JWT {token}"})
    me = result["data"]["me"]
    assert me["username"] == "testuser"
    assert me["email"] == "test@example.com"


@pytest.mark.django_db
def test_me_query_unauthenticated(client):
    result = gql(client, ME_QUERY)
    assert result["data"]["me"] is None
