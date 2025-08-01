function createProject(blank, template) {
    const name = document.getElementById("name");
    if (!name.value) return name.focus(); 

    if (blank) return window.location.href = "/app/create?name=" + name.value;
    return window.location.href = `/app/template/${template}?name=${name.value}`;
}