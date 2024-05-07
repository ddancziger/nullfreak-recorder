"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullRecorder = void 0;
const eventListener_1 = require("./eventListener");
function getSessionId() {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        sessionId = "sess-" + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
}
function getUserId() {
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = "user-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("userId", userId);
    }
    return userId;
}
const nullRecorder = (config) => {
    config = Object.assign(Object.assign({}, config), { sessionId: getSessionId(), userId: getUserId() });
    const listener = new eventListener_1.EventListener(config, (eventsData) => {
        if (!config.apiKey) {
            console.error("Nullfreak: Missing apiKey");
            return;
        }
        fetch(`https://ohzzb0pmv7.execute-api.eu-west-2.amazonaws.com/prod/events/${config.companyId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config.apiKey,
            },
            body: JSON.stringify(eventsData),
        })
            .then((response) => {
            if (!response.ok) {
                return;
            }
            return response.json();
        })
            .then((data) => {
        })
            .catch((error) => {
            console.error("Error sending events data:", error);
        });
    });
    if (typeof window === "undefined") {
        return;
    }
    else {
        listener.init();
    }
};
exports.nullRecorder = nullRecorder;
//# sourceMappingURL=index.js.map