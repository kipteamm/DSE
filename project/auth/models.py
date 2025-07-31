from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

from typing import Optional

from project.extensions import db
from project.utils.db import Model

import secrets


def generate_token():
    return secrets.token_hex(128)


class User(UserMixin, Model):
    __tablename__ = 'users'

    email = db.Column(db.String(120), unique=True, nullable=False)
    token = db.Column(db.String(128), nullable=False, default=generate_token)

    def __init__(self, email: str, password: str):
        self.email = email
        self.set_password(password)

    def set_password(self, password: str) -> None:
        self.password = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password, password)
    
    @staticmethod
    def authenticate(email: str, password: str) -> Optional['User']:
        user: 'User | None' = User.query.filter(db.func.lower(User.email) == email.lower()).first()

        if user and user.check_password(password):
            return user
        
        return None
