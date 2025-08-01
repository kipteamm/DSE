from flask_login import login_required, current_user
from flask import Blueprint, render_template, request, redirect, url_for


app_blueprint = Blueprint("app", __name__)


@app_blueprint.get("/")
def index():
    return render_template("app/index.html")


@app_blueprint.get("/app")
@login_required
def app():
    return render_template("app/app.html")


@app_blueprint.get("/app/create")
@login_required
def create():
    print(current_user)
    return render_template("app/new_project.html")