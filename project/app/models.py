from project.extensions import db
from project.utils.db import Model

import time


class Project(Model):
    __tablename__ = "projects"

    name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.String(128), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # SPECS
    template_id = db.Column(db.String(50), nullable=False)
    categories = db.Column(db.Text(5000), nullable=False)
    sections = db.Column(db.Text(5000), nullable=False)
    options = db.Column(db.Text(10000), nullable=False)

    last_edit_timestamp = db.Column(db.Float(), nullable=False)
    creation_timestamp = db.Column(db.Float(), nullable=False)

    def __init__(self, name: str, user_id: str, template_id: str, categories: str, sections: str, options: str):
        self.name = name
        self.user_id = user_id
        self.template_id = template_id
        self.categories = categories
        self.sections = sections
        self.options = options
        self.last_edit_timestamp = time.time()
        self.creation_timestamp = time.time()
