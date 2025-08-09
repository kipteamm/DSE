from project.app.functions import project_from_template
from project.app.models import Project, Submission
from project.extensions import db

from flask_login import login_required, current_user
from flask import Blueprint, render_template, redirect, request


app_blueprint = Blueprint("app", __name__)


@app_blueprint.get("/test")
def test():
    # return render_template("email/verification.html", user="john.doe", code="123456", app_domain=request.host_url, email="john.doe@gmail.com")
    return render_template("auth/awaiting_verification.html", sender="AAA@gmail.com", email="john.doe@gmail.com", next="/app")


@app_blueprint.get("/app")
@login_required
def app():
    projects = Project.query.with_entities(Project.id, Project.name, Project.template_id).filter_by(user_id=current_user.id).order_by(Project.last_edit_timestamp.desc()).all() # type: ignore
    return render_template("app/app.html", projects=projects)


@app_blueprint.get("/app/create")
@login_required
def create():
    return render_template("app/new_project.html")


@app_blueprint.get("/app/template/<string:template_id>")
@login_required
def create_from_template(template_id):
    name = request.args.get("name", "Unnamed")
    project = project_from_template(template_id, current_user.id, name)

    db.session.add(project)
    db.session.commit()

    return redirect(f"/app/edit/{project.id}?setting=options")


@app_blueprint.get("/app/edit/<string:id>")
@login_required
def edit(id):
    project = Project.query.with_entities(Project.template_id).filter_by(id=id, user_id=current_user.id).first() # type: ignore
    if not project:
        return redirect("/app")

    return render_template("app/edit.html", id=id, template=project[0])


@app_blueprint.get("/a/<string:id>")
def diagram(id):
    project = Project.query.with_entities(Project.template_id, Project.name).filter_by(id=id).first() # type: ignore
    
    if not project:
        return render_template("app/not_found.html")

    answered = False
    if current_user.is_authenticated:
        answered = Submission.query.with_entities(Submission.id).filter_by(project_id=id, user_id=current_user.id).first() != None # type: ignore

    return render_template("app/diagram.html", user=current_user, id=id, next="/a/" + id, template=project[0], answered=answered, name=project[1])
