from project.app.models import Project


def project_from_template(template: str, user_id: str, name: str) -> Project:
    if template == "political_compass":
        return Project(name, user_id, "quadrant",
                "Left#FF6A45||Authoritarian#456dff||Right#7A45FF||Libertarian#14aa5a",
                "",
                "John Doe||Jane Doe"
                )
    
    if template == "kill_marry_fuck":
        return Project(name, user_id, "venn3",
                "Kill#FF6A45||Marry#D745FF||Fuck#14aa5a",
                "Insurance Fraud||Necrophilia||Marriage Goals||Twisted Marriage Goals",
                "John Doe||Jane Doe"
                )

