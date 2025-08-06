from project.utils.body import BodySchema, BodyField

import typing as t


class NewProjectBody(BodySchema):
    name: str = BodyField("name", str, False, 0, 50)
    template: str = BodyField("template", str, True, 5, 8, ["quadrant", "venn2", "venn3", "venn4"])
    categories: dict = BodyField("categories", dict, True)
    sections: dict = BodyField("sections", dict, False)
    options: list = BodyField("options", list, True, 1, 1000)


class EditProjectBody(BodySchema):
    categories: dict = BodyField("categories", dict, False)
    sections: dict = BodyField("sections", dict, False)
    options: list = BodyField("options", list, False, 1, 1000)


class SubmissionsBody(BodySchema):
    submissions: dict = BodyField("submissions", dict, True)