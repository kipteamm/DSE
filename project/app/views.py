from flask import Blueprint, render_template, request, redirect, url_for


app_blueprint = Blueprint("app", __name__)


@app_blueprint.get("/")
def index():
    return render_template("app/index.html")


@app_blueprint.get("/app")
def app():
    return render_template("app/app.html")


@app_blueprint.get("/app/create")
def create():
    return render_template("app/new_project.html")