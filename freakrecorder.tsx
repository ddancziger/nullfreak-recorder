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
    sessionId: getSessionId(),
    userId: getUserId(),
  };
  // config.sessionId = '1'; //getSessionId(); // Set session ID from storage or generate
  // config.userId = '1'; //getUserId();
  const listener = new EventListener(config, (eventData) => {
    // This is where the event data will be sent or logged
    // Send event data
    try {
      fetch(
        "https://5t7od3yw9g.execute-api.eu-west-2.amazonaws.com/dev/event",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(eventData),
        }
      );
    } catch (error) {
      console.log(error);
    }
    console.log("Data Sent:", eventData);
  });
  listener.init();
};
