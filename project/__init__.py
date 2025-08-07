from project.auth.models import User
from project.auth.views import auth_blueprint
from project.extensions import db, mail, oauth, cache, assets
from project.main.views import main_blueprint
from project.api.views import api_blueprint
from project.app.views import app_blueprint
from project.secrets import MAIL_ADDRESS, MAIL_PASSWORD, SECRET_KEY, DEBUG

from flask_migrate import Migrate
from flask_assets import Bundle
from flask_login import LoginManager
from flask import Flask, redirect, request


app_css = Bundle("css/base.css", "css/app.css", filters="cssmin", output="gen/packed.%(version)s.css")
app_js = Bundle("js/components/share.js", "js/utils.js", "js/app.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("app_css", app_css)
assets.register("app_js", app_js)

diagram_css = Bundle("css/diagrams.css", "css/auth.css", "css/base.css", filters="cssmin", output="gen/packed.%(version)s.css")
diagram_js = Bundle("js/diagram.js", "js/utils.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("diagram_css", diagram_css)
assets.register("diagram_js", diagram_js)

index_css = Bundle("css/index.css", "css/auth.css", "css/base.css", filters="cssmin", output="gen/packed.%(version)s.css")
index_js = Bundle("js/index.js", "js/utils.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("index_css", index_css)
assets.register("index_js", index_js)

new_project_css = Bundle("css/newProject.css", "css/base.css", filters="cssmin", output="gen/packed.%(version)s.css")
new_project_js = Bundle("js/components/share.js", "js/newProject.js", "js/utils.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("new_project_css", new_project_css)
assets.register("new_project_js", new_project_js)

edit_project_css = Bundle("css/editProject.css", "css/base.css", filters="cssmin", output="gen/packed.%(version)s.css")
edit_project_js = Bundle("js/editProject.js", "js/utils.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("edit_project_css", edit_project_css)
assets.register("edit_project_js", edit_project_js)

articles_css = Bundle("css/articles.css", filters="cssmin", output="gen/packed.%(version)s.css")
assets.register("articles_css", articles_css)

auth_css = Bundle("css/auth.css", "css/base.css", filters="cssmin", output="gen/packed.%(version)s.css")
auth_js = Bundle("js/auth.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("auth_css", auth_css)
assets.register("auth_js", auth_js)

utils_js = Bundle("js/utils.js", filters="rjsmin", output="gen/packed.%(version)s.js")
assets.register("utils_js", utils_js)


def create_app():
    app = Flask(__name__)

    app.config["DEBUG"] = DEBUG
    app.config["SECRET_KEY"] = SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///./db.sqlite3'
    app.config['ASSETS_DEBUG'] = DEBUG

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(main_blueprint)
    app.register_blueprint(api_blueprint)
    app.register_blueprint(app_blueprint)

    login_manager = LoginManager(app)
    migrate = Migrate()

    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USE_SSL"] = False
    app.config["MAIL_USERNAME"] = MAIL_ADDRESS
    app.config["MAIL_PASSWORD"] = MAIL_PASSWORD

    migrate.init_app(app, db)
    assets.init_app(app)
    oauth.init_app(app)
    cache.init_app(app)
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