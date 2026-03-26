function getVideoId() {
    const url = window.location.href;

    // Case 1: Normal watch URL
    const params = new URL(url).searchParams;
    console.log("Params:", params);
    if (params.get("v")) return params.get("v");

    // Case 2: youtu.be short link
    if (url.includes("youtu.be/")) {
        console.log("Youtube be URL");
        return url.split("youtu.be/")[1].split("?")[0];
    }

    // Case 3: Shorts
    if (url.includes("/shorts/")) {
        return url.split("/shorts/")[1].split("?")[0];
    }

    return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_VIDEO_ID") {
        const videoId = getVideoId();
        sendResponse({ videoId });
    }
});