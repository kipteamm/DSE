from project.utils.responses import Errors
from project.extensions import db, cache
from project.app.models import Submission
from project.utils.db import generate_uuid
from project.api.body import NewProjectBody, EditProjectBody

import time


def proccess_placement(app, user_id: str, project_id: str, track_id: str, data: list[str]) -> None:
    with app.app_context(): 
        submission = Submission(user_id, project_id, "||".join(data))
        db.session.add(submission)
        db.session.commit()

        cache_data: dict[str, dict[str, list[int]]] = {}
        submissions = Submission.query.with_entities(Submission.submissions).filter_by(project_id=project_id).all() # type: ignore

        for _submission in submissions:
            _submission = _submission[0].split("||")
            
            for _entry in _submission:
                entry = _entry.split("``")
                pos = entry[1].split("%")

                if not entry[0] in cache_data:
                    cache_data[entry[0]] = {"top": [], "left": []}

                cache_data[entry[0]]["top"].append(pos[0])
                cache_data[entry[0]]["left"].append(pos[1])

        cache_data["__track_id"] = track_id # type: ignore
        cache.set(f"answers:{project_id}", cache_data, timeout=3600)


def cache_submissions(project_id: str) -> dict:
    submissions = Submission.query.with_entities(Submission.submissions).filter_by(project_id=project_id).all() # type: ignore
    cache_data: dict[str, dict[str, list[int]]] = {}

    for _submission in submissions:
        _submission = _submission[0].split("||")
        
        for _entry in _submission:
            entry = _entry.split("``")
            pos = entry[1].split("%")

            if not entry[0] in cache_data:
                cache_data[entry[0]] = {"top": [], "left": []}

            cache_data[entry[0]]["top"].append(pos[0])
            cache_data[entry[0]]["left"].append(pos[1])

    cache_data["__track_id"] = generate_uuid() # type: ignore
    cache.set(f"answers:{project_id}", cache_data, timeout=3600)

    return cache_data


def _check_categories(body: NewProjectBody | EditProjectBody, categories: int, project: dict[str, list]) -> tuple[bool, dict | None]:
    if len(body.categories) != categories:
        return False, Errors.NOT_ENOUGH_CATEGORIES.as_dict()
     
    for i in range(1, categories + 1):
        value = body.categories[str(i)]
        
        name = value["name"]
        if not name:
            return False, Errors.INVALID_CATEGORIES.as_dict() 

        name_length = len(name)
        if name_length < 1:
            return False, Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field": "category", "not_reached_by": 1})

        if name_length > 32:
            return False, Errors.MAX_LENGTH_EXCEEDED.as_dict({"field": "category", "exceeded_by": name_length - 32})
        
        if "||" in name:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "category", "characters": "||"})
        
        if "``" in name:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "category", "characters": "``"})

        color = value["color"]
        if not color:
            color = "#456dff"

        elif len(color) > 7 or not "#" in color:
            return False, Errors.INVALID_CATEGORIES.as_dict()

        project["categories"].append(name + color)

    return True, None


def _check_sections(body: NewProjectBody | EditProjectBody, categories: int, project: dict[str, list]) -> tuple[bool, dict | None]:
    intersections = 1 if categories == 2 else 4 if categories == 3 else 11

    if len(body.sections) != intersections:
        return False, Errors.NOT_ENOUGH_SECTIONS.as_dict()

    for i in range(1, intersections + 1):
        section = body.sections[str(i)]

        section_length = len(section)
        if section_length < 1:
            return False, Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field": "section", "not_reached_by": 1})

        if section_length > 32:
            return False, Errors.MAX_LENGTH_EXCEEDED.as_dict({"field": "section", "exceeded_by": section_length - 32})

        if "||" in section:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "section", "characters": "||"})
        
        if "``" in section:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "section", "characters": "``"})

        project["sections"].append(section)
    
    return True, None


def _check_options(body: NewProjectBody | EditProjectBody, project: dict[str, list]) -> tuple[bool, dict | None]:
    for option in body.options:
        option_length = len(option)
        if option_length < 1:
            return False, Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field": "option", "not_reached_by": 1})

        if option_length > 64:
            return False, Errors.MAX_LENGTH_EXCEEDED.as_dict({"field": "option", "exceeded_by": option_length - 64})
        
        if "||" in option:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "option", "characters": "||"})

        if "``" in option:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "option", "characters": "``"})

        project["options"].append(option)
    
    return True, None


def parse_diagram(body: NewProjectBody) -> tuple[bool, dict]:
    project = {
        "categories": [],
        "sections": [],
        "options": []
    }

    categories = 4 if body.template == "quadrant" else int(body.template.replace("venn", ""))
    
    success, errors = _check_categories(body, categories, project)
    if not success:
        return False, errors # type: ignore

    if body.template != "quadrant":
        success, errors = _check_sections(body, categories, project)
        
        if not success:
            return False, errors # type: ignore

    success, errors = _check_options(body, project)
    if not success:
        return False, errors # type: ignore

    return True, project

    
def parse_edit_diagram(body: EditProjectBody, template: str) -> tuple[bool, dict]:
    categories = 4 if template == "quadrant" else int(template.replace("venn", ""))
    updates = {
        "last_edit_timestamp": time.time()
    }

    if body.categories:
        updates["categories"] = []
        success, errors = _check_categories(body, categories, updates)

        if not success:
            return False, errors # type: ignore

    if body.sections and template != "quadrant":
        updates["sections"] = []
        success, errors = _check_sections(body, categories, updates)

        if not success:
            return False, errors # type: ignore

    if body.options:
        updates["options"] = []
        success, errors = _check_options(body, updates)

        if not success:
            return False, errors # type: ignore

    return True, updates