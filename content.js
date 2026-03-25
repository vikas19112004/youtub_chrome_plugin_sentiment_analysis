function getComments() {
    let comments = [];

    document.querySelectorAll("#content-text").forEach((el) => {
        comments.push(el.innerText);
    });

    // return comments.slice(0, 20); // take first 20 comments
    return comments
}

// Listen for message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_COMMENTS") {
        const comments = getComments();
        sendResponse({ comments });
    }
});