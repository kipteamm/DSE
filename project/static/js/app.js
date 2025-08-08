function createProject(blank, template) {
    const name = document.getElementById("name");
    if (!name.value) return name.focus(); 

    if (blank) return window.location.href = "/app/create?name=" + name.value;
    return window.location.href = `/app/template/${template}?name=${name.value}`;
}

async function loadSubmissions(id) {
    toggleModal("project");

    const response = await fetch(`/api/diagram/${id}/submissions`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    let HTML = `<h2>Submissions</h2><span class="close" onclick="toggleModal('project')">&times;</span>`;

    json.submissions.forEach(submission => {
        const date = submission.created_at.split(" ");
        date.splice(4, 2);

        HTML += `<div class="pri-sec-con submission" id="${submission.id}">
            <b>${submission.email}</b>
            <span>${date.join(" ")}</span>
            <iconify-icon icon="heroicons-solid:trash" style="font-size: 18px;"onclick="deleteSubmission('${id}', '${submission.id}')"></iconify-icon>
        </div>`;
    });

    document.getElementById("project-modal").innerHTML = HTML;
}

async function deleteProject(id) {
    const response = await fetch(`/api/diagram/${id}/delete`, {method: "DELETE", headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    document.getElementById("project-" + id).remove();
}

async function deleteSubmission(projectId, submissionId) {
    const response = await fetch(`/api/submission/${projectId}/${submissionId}/delete`, {method: "DELETE", headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    document.getElementById(submissionId).remove();
}

function share(id) {
    shareId = id;
    toggleModal('share');
}