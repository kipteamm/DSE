from authlib.integrations.flask_client import OAuth

from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail

oauth = OAuth()
mail = Mail()
db = SQLAlchemy()
