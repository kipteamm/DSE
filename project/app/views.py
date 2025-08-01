from project.app.models import Project

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
    project = Project.query.with_entities(Project.template_id).filter_by(id=id).first()
    
    if not project:
        return render_template("app/not_found.html")

    if project[0] == "quadrant":
        return render_template("diagrams/quadrant.html", user=current_user, id=id, next="/a/" + id)
    
    if project[0] == "venn4":
        return render_template("diagrams/venn4.html", user=current_user, id=id, next="/a/" + id)
    
    if project[0] == "venn3":
        return render_template("diagrams/venn3.html", user=current_user, id=id, next="/a/" + id)

    return render_template("diagrams/venn2.html", user=current_user, id=id, next="/a/" + id)
