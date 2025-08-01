from project.auth.models import User
from project.auth.views import auth_blueprint
from project.extensions import db, mail, oauth
from project.api.views import api_blueprint
from project.app.views import app_blueprint
from project.secrets import MAIL_PASSWORD, SECRET_KEY

from flask_migrate import Migrate
from flask_login import LoginManager
from flask import Flask, redirect, request


def create_app():
    app = Flask(__name__)

    app.config["DEBUG"] = True
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///./db.sqlite3'

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(api_blueprint)
    app.register_blueprint(app_blueprint)

    login_manager = LoginManager(app)
    migrate = Migrate()

    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USE_SSL"] = False
    app.config["MAIL_USERNAME"] = "noreply.crimecanvas@gmail.com"
    app.config["MAIL_PASSWORD"] = MAIL_PASSWORD

    migrate.init_app(app, db)
    oauth.init_app(app)
    mail.init_app(app)
    db.init_app(app)

    app.extensions["mail"].debug = 0
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)

    @login_manager.unauthorized_handler
    def unauthorized():
        path = request.full_path

        return redirect(f"/login?next={path if "=" in path else request.path}")

    return app