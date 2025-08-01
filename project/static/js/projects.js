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

        HTML += `<div class="pri-sec-con submission">
            <b>${submission.email}</b>${date.join(" ")}
            <iconify-icon icon="heroicons-solid:trash"></iconify-icon>
        </div>`;
    });

    document.getElementById("project-modal").innerHTML = HTML;
}