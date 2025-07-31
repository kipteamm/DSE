from flask import Blueprint, render_template, request, redirect, url_for


app_blueprint = Blueprint("app", __name__)


@app_blueprint.get("/")
def index():
    return render_template("app/index.html")