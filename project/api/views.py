from project.auth.decorators import authorized
from project.utils.responses import Errors
from project.api.functions import parse_diagram, proccess_placement, cache_submissions
from project.auth.models import User
from project.app.models import Project, Submission
from project.extensions import db, cache
from project.utils.db import generate_uuid
from project.api.body import NewProjectBody, SubmissionsBody

from flask import Blueprint, g, request, current_app

import threading


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


@api_blueprint.delete("/diagram/<string:id>/delete")
@authorized()
def delete_diagram(id):
    deleted = Project.query.filter_by(id=id, user_id=g.user.id).delete()
    if not deleted:
        return Errors.PROJECT_NOT_FOUND.as_dict(), 404
    
    db.session.commit()
    return {"success": True}, 200


@api_blueprint.post("/diagram/<string:id>/submit")
@authorized()
def submit(id):
    body = SubmissionsBody(request.json)
    if not body.is_valid():
        return body.error, 400

    if Submission.query.with_entities(Submission.id).filter_by(project_id=id, user_id=g.user.id).first(): # type: ignore
        return Errors.ALREADY_ANSWERED.as_dict(), 403
    
    project = Project.query.with_entities(Project.options).filter_by(id=id).first() # type: ignore
    
    if not project:
        return Errors.PROJECT_NOT_FOUND.as_dict(), 404
    
    options = project[0].split("||")
    data = []

    for key, value in body.submissions.items():
        if not key in options:
            return Errors.INVALID_OPTION.as_dict(), 400
        
        data.append(f"{key}``{value}")

    track_id = generate_uuid()
    threading.Thread(
        target=proccess_placement,
        args=(current_app._get_current_object(), g.user.id, id, track_id, data) # type: ignore
    ).start()


    return {"track_id": track_id}, 200


@api_blueprint.get("/diagram/<string:id>/answers")
@authorized()
def answers(id):
    if not Submission.query.with_entities(Submission.id).filter_by(project_id=id, user_id=g.user.id).first(): # type: ignore
        return Errors.NOT_ANSWERED.as_dict(), 403

    project = Project.query.with_entities(Project.options).filter_by(id=id).first() # type: ignore
    
    if not project:
        return Errors.PROJECT_NOT_FOUND.as_dict(), 404
    
    tracking = request.args.get("tracking", "false") == "true"
    data = cache.get(f"answers:{id}")

    if not data:
        if tracking:
            return {"tracking": True}, 204

        return cache_submissions(id), 200

    return data, 200


@api_blueprint.get("/diagram/<string:id>/submissions")
@authorized()
def submissions(id):
    project = Project.query.with_entities(Project.options).filter_by(id=id, user_id=g.user.id).first() # type: ignore
    
    if not project:
        return Errors.PROJECT_NOT_FOUND.as_dict(), 404
    
    data = cache.get(f"submissions:{id}")
    if data:
        return data, 200

    results = (
        db.session.query(Submission.id, Submission._created_at, User.email) # type: ignore
        .join(User, Submission.user_id == User.id)
        .filter(Submission.project_id == id)
        .all()
    )
    data = []

    for result in results:
        data.append({"id": result[0], "created_at": result[1], "email": result[2]})

    cache.set(f"submissions:{id}", data, timeout=600)
    return {"submissions": data}, 200