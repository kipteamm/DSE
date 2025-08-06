from project.app.models import Project


def project_from_template(template: str, user_id: str, name: str) -> Project:
    if template == "political_compass":
        return Project(name, user_id, "quadrant",
                "Left#FF6A45||Authoritarian#456dff||Right#7A45FF||Libertarian#14aa5a",
                "",
                "John Doe||Jane Doe"
                )
    
    if template == "friendgroup":
        return Project(name, user_id, "venn4",
                "The Planner#456dff||The Latecomer#14aa5a||Never Available#ff0000||Main Charcter Syndrome#f7ec1f",
                "Chronically Challenged Coordinator||Absent Leader||Are they even real?||Only in groupchat||Social menace||Grand entrance||Moved elsewhere||Came from other party||Overbooked||A myth||That one person",
                "John Doe||Jane Doe"
                )
    
    if template == "kill_marry_fuck":
        return Project(name, user_id, "venn3",
                "Kill#FF6A45||Marry#D745FF||Fuck#14aa5a",
                "Insurance Fraud||Necrophilia||Marriage Goals||Twisted Marriage Goals",
                "John Doe||Jane Doe"
                )
    
    if template == "sleeping_habtis":
        return Project(name, user_id, "venn2",
                "Night owl#7A45FF||Early bird#14aa5a",
                "Healthy",
                "John Doe||Jane Doe"
                )

