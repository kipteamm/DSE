from authlib.integrations.flask_client import OAuth

from flask_sqlalchemy import SQLAlchemy
from flask_caching import Cache
from flask_mail import Mail

cache = Cache(config={"CACHE_TYPE" : "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300})
oauth = OAuth()
mail = Mail()
db = SQLAlchemy()
