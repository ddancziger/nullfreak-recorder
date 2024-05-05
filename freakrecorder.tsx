import EventListener, { EventListenerConfig } from "./eventListener";
declare global {
  interface Window {
    nullRecorder: any;
  }
}

function getSessionId() {
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    // Generate a new session ID
    sessionId = "sess-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

function getUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    // Generate a new user ID
    userId = "user-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

window.nullRecorder = function (config: EventListenerConfig) {
  config = {
    ...config,
    sessionId: getSessionId(),
    userId: getUserId(),
  };
  const listener = new EventListener(config, (eventsData) => {
    if (!config.apiKey) {
      console.error("Missing apiKey");
      return;
    }
    fetch(
      "https://ohzzb0pmv7.execute-api.eu-west-2.amazonaws.com/prod/events",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          // Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(eventsData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          return;
        }
        return response.json(); // or response.text() if the response is not in JSON format
      })
      .then((data) => {
        return;
      })
      .catch((error) => {
        return;
      });
  });
  listener.init();
};
