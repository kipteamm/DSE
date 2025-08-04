from project.app.models import Project, Submission

from flask_login import login_required, current_user
from flask import Blueprint, render_template, request


app_blueprint = Blueprint("app", __name__)


@app_blueprint.get("/test")
def test():
    return render_template("email/verification.html", user="toro.een", code="123456", app_domain=request.host_url, email="toro.een@gmail.com")
    # return render_template("auth/awaiting_verification.html", sender="AAA@gmail.com", email="toro.een@gmail.com", next="/app")


@app_blueprint.get("/app")
@login_required
def app():
    projects = Project.query.with_entities(Project.id, Project.name, Project.template_id).filter_by(user_id=current_user.id).all()
    return render_template("app/app.html", projects=projects)


@app_blueprint.get("/app/create")
@login_required
def create():
    return render_template("app/new_project.html")


@app_blueprint.get("/app/edit/<string:id>")
@login_required
def edit(id):
    return render_template("app/edit.html")


@app_blueprint.get("/a/<string:id>")
def diagram(id):
    project = Project.query.with_entities(Project.template_id, Project.name).filter_by(id=id).first() # type: ignore
    
    if not project:
        return render_template("app/not_found.html")

    answered = Submission.query.with_entities(Submission.id).filter_by(project_id=id, user_id=current_user.id).first() # type: ignore

    return render_template("app/diagram.html", user=current_user, id=id, next="/a/" + id, template=project[0], answered=answered != None, name=project[1])
