from project.utils.responses import Errors
from dataclasses import dataclass, field

import typing as t


@dataclass
class BodyField:
    name: str
    type: t.Type
    required: bool
    min_length: int = 0
    max_length: int = 500
    predefined: t.List | t.Set = field(default_factory=list)
    default: t.Any = None


class BodySchema:
    def __init__(self, body: t.Optional[t.Dict]=None):
        self._body: t.Optional[t.Dict] = body
        self._error: t.Optional[t.Dict] = None

    def _valid_field(self, field: BodyField, value) -> bool:
        if field.type == bool and isinstance(value, str):
            value = True if value == "on" else False if value == "off" else None

        setattr(self, field.name, value)

        if not value and not field.required:
            return True
        
        if not value:
            self._error = Errors.EMPTY_VALUE.as_dict({"field": field.name, "expected": field.type.__name__})
            return False
        
        # check type
        if not isinstance(value, field.type):
            self._error = Errors.INVALID_TYPE.as_dict({"field": field.name, "expected": field.type.__name__})
            return False
        
        # integer checks
        if field.type == int:
            if field.min_length and value < field.min_length:
                self._error = Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field" : field.name, "not_reached_by": field.min_length - value})
                return False

            if field.max_length and value > field.max_length:
                self._error = Errors.MAX_LENGTH_EXCEEDED.as_dict({"field" : field.name, "exceeded_by": value - field.max_length})
                return False

        # bool checks
        if field.type == bool:
            return True

        # string and list checks
        if field.min_length and len(value) < field.min_length:
            self._error = Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field" : field.name, "not_reached_by": len(value) - field.max_length})
            return False
        
        if field.predefined:
            if isinstance(value, str) and value not in field.predefined:
                self._error = Errors.INVALID_VALUE.as_dict({"values": ", ".join(field.predefined)})
                return False
            
            if isinstance(value, list):
                for item in value:
                    if item not in field.predefined:
                        self._error = Errors.INVALID_VALUE.as_dict({"values": ", ".join(field.predefined)})
        
        return True

    def is_valid(self) -> bool:
        if not self._body:
            self._error = Errors.BODY_NOT_PRESENT.as_dict()

            return False

        for field in self.__class__.__dict__.values():
            if not isinstance(field, BodyField):
                continue

            if not field.name in self._body:
                if field.required:
                    self._error = Errors.FIELD_NOT_PRESENT.as_dict({"field": field.name})
                    return False
                
                setattr(self, field.name, field.default)
                continue
            
            if not self._valid_field(field, self._body.get(field.name)):
                return False
        
        return True
    
    @property
    def error(self) -> dict:
        if self._error:
            return self._error
        
        return {"error" : "Could not parse body."}
    