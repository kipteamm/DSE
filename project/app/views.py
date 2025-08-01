from project.app.models import Project, Submission

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
    return render_template("app/new_project.html")


@app_blueprint.get("/a/<string:id>")
def diagram(id):
    project = Project.query.with_entities(Project.template_id).filter_by(id=id).first() # type: ignore
    
    if not project:
        return render_template("app/not_found.html")

    answered = Submission.query.with_entities(Submission.id).filter_by(project_id=id, user_id=current_user.id).first() # type: ignore

    return render_template("app/diagram.html", user=current_user, id=id, next="/a/" + id, template=project[0], answered=answered != None)
