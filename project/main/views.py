from project.auth.models import User
from project.app.models import Project, Submission
from project.extensions import cache

from flask import Blueprint, render_template


main_blueprint = Blueprint("main", __name__)


@main_blueprint.get("/")
def index():
    data = cache.get("statistics")
    if not data:
        data = {
            "users": User.query.count(),
            "projects": Project.query.count(),
            "submissions": Submission.query.count(),
        }

        cache.set("statistics", data, timeout=3600)

    return render_template("app/index.html", statistics=data)


@main_blueprint.get("/article/<string:article>")
def article(article: str):
    return render_template(f"articles/{article}.html")
