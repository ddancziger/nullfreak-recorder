"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nullRecorder = void 0;
const eventListener_1 = require("./eventListener");
function getSessionId() {
    if (typeof window === "undefined") {
        return "server-session";
    }
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
        sessionId = "sess-" + Math.random().toString(36).substr(2, 9);
        sessionStorage === null || sessionStorage === void 0 ? void 0 : sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
}
function getUserId() {
    if (typeof window === "undefined") {
        return "server-user";
    }
    let userId = localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem("userId");
    if (!userId) {
        userId = "user-" + Math.random().toString(36).substr(2, 9);
        localStorage === null || localStorage === void 0 ? void 0 : localStorage.setItem("userId", userId);
    }
    return userId;
}
function nullRecorder(config) {
    if (typeof window === "undefined") {
        return;
    }
    const completeConfig = Object.assign(Object.assign({}, config), { sessionId: getSessionId(), userId: getUserId() });
    const listener = eventListener_1.EventListener.getInstance(completeConfig, (eventsData) => {
        if (!(completeConfig === null || completeConfig === void 0 ? void 0 : completeConfig.apiKey)) {
            console.error("Nullfreak: Missing apiKey");
            return;
        }
        fetch(`https://ohzzb0pmv7.execute-api.eu-west-2.amazonaws.com/prod/events/${completeConfig.companyId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": completeConfig.apiKey,
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
            .catch((error) => { });
    });
    window.nullRecorder = nullRecorder;
}
exports.nullRecorder = nullRecorder;
//# sourceMappingURL=recorder.js.map