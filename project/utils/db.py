from project.extensions import db

from datetime import datetime, timezone

import uuid


def generate_uuid():
    return str(uuid.uuid4().hex)


class Model(db.Model):
    __abstract__ = True

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    _created_at = db.Column("created_at", db.DateTime, default=db.func.now())

    def __init__(self, *args, **kwargs):
        if "id" not in kwargs:
            self.id = generate_uuid()
        super().__init__(*args, **kwargs)
        
    @property
    def created_at(self) -> datetime:
        return self._created_at.replace(tzinfo=timezone.utc)