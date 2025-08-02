from flask_login import UserMixin

from project.extensions import db
from project.utils.db import Model

import secrets
import time


def generate_token():
    return secrets.token_hex(128)


class User(UserMixin, Model):
    __tablename__ = "users"

    email = db.Column(db.String(120), unique=True, nullable=False)
    token = db.Column(db.String(128), nullable=False, default=generate_token)

    def __init__(self, email: str):
        self.email = email

    @classmethod
    def get_or_create(cls, email: str) -> 'User':
        user: 'User | None' = User.query.filter(db.func.lower(User.email) == email.lower()).first()
        if user:
            return user
        
        user = User(email)
        db.session.add(user)
        db.session.commit()

        return user


class EmailAuthentication(db.Model):
    __tablename__ = "email_authentications"

    email = db.Column(db.String(120), primary_key=True, nullable=False)
    code = db.Column(db.String(6), nullable=True)

    attempts = db.Column(db.Integer(), default=0)
    last_attempt = db.Column(db.Float(), default=0)

    def __init__(self, email: str):
        self.email = email

    @classmethod
    def get_or_create(cls, email: str) -> 'EmailAuthentication':
        authentication: 'EmailAuthentication | None' = EmailAuthentication.query.filter(db.func.lower(EmailAuthentication.email) == email.lower()).first()
        if authentication:
            return authentication
        
        authentication = EmailAuthentication(email)
        db.session.add(authentication)
        db.session.commit()

        return authentication
