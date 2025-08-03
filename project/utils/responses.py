from typing import Optional, Dict

from enum import Enum


class Response(Enum):
    def as_dict(self, arguments: Optional[Dict[str, str | int]]=None) -> Dict[str, str | int]:
        response_message = self.value[1]

        if arguments:
            response_message = response_message.format(**arguments)

        response_type = getattr(self.__class__, "response_type", "unexpected_error")

        if isinstance(response_type, Enum):
            response_type = response_type.value

        return {
            "code": self.value[0],
            response_type: response_message
        }


class Errors(Response):
    response_type = "error"
    
    AUTHORIZATION_HEADER_NOT_FOUND = (4000, "Authorization header not found.")
    INVALID_AUTHORIZATION_TYPE = (4001, "Invalid authorization type, expected Bearer.")
    INVALID_AUTHORIZATION_TOKEN = (4002, "Token is invalid.")
    INVALID_PERMISSIONS = (4003, "You do not have the required permissions.")
    BODY_NOT_PRESENT = (4004, "No body was provided.")
    FIELD_NOT_PRESENT = (4005, "Field {field} is not present.")
    MIN_LENGTH_NOT_REACHED = (4006, "Minimum length of field {field} not reached by {not_reached_by}.")
    MAX_LENGTH_EXCEEDED = (4007, "Maximum length of field {field} exceeded by {exceeded_by}.")
    INVALID_TYPE = (4009, "Invalid type for field {field}. Expected {expected}.")
    UNEXPECTED_ERROR = (4010, "An unexpected error occured. The developers have been notified.")
    INVALID_VALUE = (4015, "Invalid value, must be one of {values}.")
    INVALID_CATEGORIES = (4016, "One or more category is not valid.")
    INTERNAL_CHARACTERS_USED = (4017, "{characters} are present in {field} which is not allowed.")
    PROJECT_NOT_FOUND = (4018, "Project not foun.")
    NOT_ENOUGH_CATEGORIES = (4019, "Not enough categories.")
    NOT_ENOUGH_SECTIONS = (4020, "Not enough sections.")
    INVALID_OPTION = (4021, "Invalid option.")
    NOT_ANSWERED = (4022, "You hacce not yet answered this project yourself and therefore you have no access.")
    ALREADY_ANSWERED = (4023, "You already answered to this project.")
    EMPTY_VALUE = (4024, "No value present for required {field}. Expected {expected}")


class Success(Response):
    response_type = "success"

    VERIFICATION_EMAIL_SENT = (2000, "A verification email has been sent.")
    NOTHING_FOUND = (2001, "Nothing found.")
    SESSION_STARTED = (2002, "Session started.")