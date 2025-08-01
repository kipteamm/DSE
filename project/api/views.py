from project.auth.decorators import authorized
from project.utils.responses import Errors
from project.api.functions import parse_diagram
from project.app.models import Project
from project.extensions import db
from project.api.body import NewProjectBody

from flask import Blueprint, g, request


api_blueprint = Blueprint("api", __name__, url_prefix="/api")


@api_blueprint.post("/create")
@authorized()
def create_project():
    body = NewProjectBody(request.json)
    
    if not body.is_valid():
        return body.error, 400

    valid, project = parse_diagram(body)
    print(project)

    if not valid:
        return project, 400

    project = Project("Unnamed", g.user.id, body.template, 
                      "||".join(project["categories"]), 
                      "||".join(project["sections"]), 
                      "||".join(project["options"]))
    db.session.add(project)
    db.session.commit()

    return {"id": project.id}, 200


@api_blueprint.get("/diagram/<string:id>")
@authorized()
def get_diagram(id):
    project = Project.query.with_entities(Project.categories, Project.sections, Project.options).filter_by(id=id).first() # type: ignore
    
    if not project:
        return Errors.PROJECT_NOT_FOUND.as_dict(), 404
    
    return {
        "categories": {i + 1: v for i, v in enumerate(project[0].split("||"))},
        "sections": {i + 1: v for i, v in enumerate(project[1].split("||"))},
        "options": project[2].split("||")
    }