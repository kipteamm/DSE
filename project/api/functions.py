from project.utils.responses import Errors
from project.api.body import NewProjectBody


def _get_sections(body: NewProjectBody, categories: int, project: dict[str, list]) -> tuple[bool, dict | None]:
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

        project["sections"].append(section)
    
    return True, None


def parse_diagram(body: NewProjectBody) -> tuple[bool, dict]:
    project = {
        "categories": [],
        "sections": [],
        "options": []
    }

    categories = 4 if body.template == "quadrant" else int(body.template.replace("venn", ""))

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

        colour = value["colour"]
        if not colour:
            colour = "#456dff"

        elif len(colour) > 7 or not "#" in colour:
            return False, Errors.INVALID_CATEGORIES.as_dict()

        project["categories"].append(name + colour)

    if body.template != "quadrant":
        success, errors = _get_sections(body, categories, project)
        
        if not success:
            return False, errors # type: ignore

    for option in body.options:
        option_length = len(option)
        if option_length < 1:
            return False, Errors.MIN_LENGTH_NOT_REACHED.as_dict({"field": "option", "not_reached_by": 1})

        if option_length > 64:
            return False, Errors.MAX_LENGTH_EXCEEDED.as_dict({"field": "option", "exceeded_by": option_length - 64})
        
        if "||" in option:
            return False, Errors.INTERNAL_CHARACTERS_USED.as_dict({"field": "option", "characters": "||"})

        project["options"].append(option)

    return True, project

    