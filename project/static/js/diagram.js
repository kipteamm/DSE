function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

let main;
async function loadTemplate() {
    const res = await fetch(`/static/icons/${template}.svg`);
    const svg = await res.text();
    main.innerHTML += svg;

    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `/static/css/${template}.css`;
    document.head.appendChild(cssLink);
}

let options;
let dimension;
async function loadDiagram() {
    const response = await fetch(`/api/diagram/${id}`, {method: "GET", headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    await loadTemplate();

    for (const [id, _category] of Object.entries(json.categories)) {
        const category = _category.split("#");
        const elm = document.createElement("b");
        elm.id = "category-" + id;
        elm.innerText = category[0];

        main.appendChild(elm);
        document.querySelector(`[elm="category-${id}"]`).style.fill = `#${category[1]}66`;
    }

    for (const [id, section] of Object.entries(json.sections)) {
        const elm = document.createElement("span");
        elm.id = "section-" + id;
        elm.innerText = section;

        main.appendChild(elm);
    }
}

async function prepareSubmissions() {
    await loadDiagram();
    
    options = json.options;
    shuffle(options);
    
    counter = document.getElementById("counter");
    option = document.getElementById("option");
    
    currentOption = options[0];
    option.innerText = currentOption;
    counter.innerText = options.length;
    
    document.getElementById("loading").style.display = "none";
    main.classList.add("active");
    dimension = main.offsetWidth;
}

let item;
let option;
let counter;
function diagramInit() {
    main = document.getElementById("main");
    item = document.getElementById("item");

    if (userId) {
        if (answered) return loadAnswers();
        return prepareSubmissions();
    }
    toggleModal("auth");
}

if (document.readyState !== 'loading') {
    diagramInit();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        diagramInit();
    });
}

let placements = {};
document.addEventListener("mousemove", (event) => {
    if (!isPlacing) return;
    const y = event.clientY;
    const x = event.clientX;

    item.style.top = `${y}px`;
    item.style.left = `${x}px`;
});

document.addEventListener("click", (event) => {
    if (!isPlacing) return;
    if (!event.target.closest("ellipse") && !event.target.closest("path")) return;

    const offset = (window.innerWidth - dimension) / 2;
    const top = Math.round((event.clientY / dimension) * 100);
    const left = Math.round(((event.clientX - offset) / dimension) * 100);

    const elm = document.createElement("li");
    elm.innerText = currentOption;
    elm.style.top = top + "%";
    elm.style.left = left + "%";
    elm.onclick = (event) => replace(event, elm);

    main.appendChild(elm);
    placements[elm.innerText] = `${top}%${left}`;

    togglePlacing(null, option);

    if (!isReplacing) {
        counter.innerText = options.length - 1;
        options.shift();
    }

    if (options.length === 0) {
        option.innerText = "All done!";
        return;
    }

    currentOption = options[0];
    option.innerText = currentOption;
    isReplacing = false;
});

let isPlacing = false;
function togglePlacing(event, btn) {
    if (options.length === 0) return;

    btn.classList.toggle("secondary", isPlacing);
    btn.classList.toggle("tertiary", !isPlacing);
    item.classList.toggle("active", !isPlacing);

    isPlacing = !isPlacing
    if (!isPlacing) return;

    const y = event.clientY;
    const x = event.clientX;

    item.style.top = `${y}px`;
    item.style.left = `${x}px`;
    item.innerText = currentOption || btn.innerText;
}

let isReplacing = false;
let currentOption = null;
function replace(event, elm) {
    if (isPlacing) togglePlacing(null, option);

    delete placements[elm.innerText];
    currentOption = elm.innerText;
    option.innerText = currentOption;
    elm.remove();

    isReplacing = true;
    togglePlacing(event, option);
}

function skip() {
    if (isPlacing) togglePlacing(null, option);

    options.shift();
    currentOption = options[0];
    option.innerText = currentOption;
}

async function submit() {
    document.getElementById("loading").style.display = "flex";
    document.getElementById("loading-text").innerText = "Parsing results";
    main.classList.add("anwered")
    main.classList.remove("active");
    
    const response = await fetch(`/api/diagram/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({"submissions": placements}),
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getCookie("i_t")}`
        }
    });

    if (!response.ok) return;
    const json = await response.json();
    const trackId = json.track_id;

    const pollStatus = async () => {
        const response = await fetch(`/api/diagram/${id}/answers?tracking=true`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
        if (response.status === 403 || response.status === 204) return setTimeout(pollStatus, 1000);
        else if (!response.ok) return;
        
        const json = await response.json();
        if (json.__track_id === trackId) return parseAnswers(json);

        setTimeout(pollStatus, 1000);
    };

    pollStatus();
}

async function loadAnswers() {
    const response = await fetch(`/api/diagram/${id}/answers`, {headers: {"Authorization": `Bearer ${getCookie("i_t")}`}});
    if (!response.ok) return;

    const json = await response.json();
    parseAnswers(json);

    await loadDiagram();

    document.getElementById("loading").style.display = "none";
    main.classList.add("answered")
    main.classList.add("active");
}

let orderedData = {};
function parseAnswers(data) {
    document.querySelectorAll("li").forEach(element => { element.remove() });

    for (const [key, positions] of Object.entries(data)) {
        if (key === "__track_id") continue;

        const medianTop = calculateMedian(positions.top);
        const medianLeft = calculateMedian(positions.left);

        orderedData[key] = {
            "top": positions.top,
            "left": positions.left,
            "median_top": medianTop,
            "media_left": medianLeft
        }

        const elm = document.createElement("li");
        elm.innerText = key;
        elm.style.top = medianTop + "%";
        elm.style.left = medianLeft + "%";

        main.appendChild(elm);
    }

    document.getElementById("loading").style.display = "none";
    main.classList.add("active");
}

function calculateMedian(array) {
    if (array.length % 2 !== 0) return array[Math.floor(array.length / 2)];

    return (array[array.length / 2 - 1] + array[array.length / 2]) / 2;
}