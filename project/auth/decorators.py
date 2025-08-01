# from project.utils.permissions import Permissions
from project.utils.responses import Errors
from project.auth.models import User

from functools import wraps
from flask import request, g

import typing as t
import time


def valid_authorization(authorization) -> t.Tuple[str, int] | t.Tuple[t.Dict[str, str | int], int]:
    if not authorization:
        return Errors.AUTHORIZATION_HEADER_NOT_FOUND.as_dict(), 401
                
    if isinstance(authorization, str):
        return authorization, 200
    
    if not authorization.type == "bearer":
        return Errors.INVALID_AUTHORIZATION_TYPE.as_dict(), 401

    return authorization.token, 200


# def authorized(permission: int=Permissions.USER):
def authorized():
    def _decorator(f):
        @wraps(f)

        def _decorated_function(*args, **kwargs):
            token, status = valid_authorization(request.authorization)

            if status != 200:
                return token, status
            
            user = User.query.filter_by(token=token).first()

            if not user:
                return Errors.INVALID_AUTHORIZATION_TOKEN.as_dict(), 401
            
            if not user.active:
                return Errors.USER_NOT_ACTIVE.as_dict(), 401
            
            # if not user.permissions & permission:
            #     return Errors.INVALID_PERMISSIONS.as_dict(), 401
            
            g.user = user

            return f(*args, **kwargs)

        return _decorated_function
    
    return _decorator