from flask_login import UserMixin

from project.extensions import db
from project.utils.db import Model

import secrets


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