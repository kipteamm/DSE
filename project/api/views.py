from project.auth.decorators import authorized
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

    if not valid:
        return project, 400
    
    project = Project("Unnamed", g.user.id, body.template, 
                      project["categories"].join("||"), 
                      project["sections"].join("||"), 
                      project["options"].join("||"))
    db.session.add(project)
    db.commit()

    return {"id": project.id}, 200