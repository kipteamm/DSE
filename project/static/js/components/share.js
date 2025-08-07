let shareId;

function copyUrl() {
    navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/a/${shareId}`);
    alert("copied");
}

function makeChanges() { return window.location.href = "/app/edit/" + shareId; }
function vote() { return window.location.href = "/a/" + shareId; }

let shouldRedirect = false;
function moreShare() {
    const shareText = "Check out my diagram!";
    const shareUrl = `${window.location.protocol}//${window.location.host}/a/${shareId}`;

    if (!navigator.share) return;
    shouldRedirect = true;

    navigator.share({
        title: "Vote on my diagram!",
        text: shareText,
        url: shareUrl
    }).catch(() => {
        shouldRedirect = false;
    });
}