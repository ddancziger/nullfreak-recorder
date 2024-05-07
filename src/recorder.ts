// index.ts

import { EventListener, EventListenerConfig } from "./eventListener";

// Declare a global enhancement for the Window object to hold the nullRecorder instance
declare global {
  interface Window {
    nullRecorder?: typeof nullRecorder;
  }
}

// Utility function to get a session ID
function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = "sess-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

// Utility function to get a user ID
function getUserId(): string {
  if (typeof window === "undefined") {
    return "server-user";
  }
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

// Main function to initialize and configure the event listener
function nullRecorder(
  config: Partial<EventListenerConfig> & { companyId: string; apiKey: string }
): void {
  if (typeof window === "undefined") {
    // Avoid initializing in server-side environments
    return;
  }

  // Configure with session and user IDs
  const completeConfig: EventListenerConfig = {
    ...config,
    sessionId: getSessionId(),
    userId: getUserId(),
  };

  const listener = new EventListener(completeConfig, (eventsData) => {
    if (!completeConfig.apiKey) {
      console.error("Nullfreak: Missing apiKey");
      return;
    }
    fetch(
      `https://ohzzb0pmv7.execute-api.eu-west-2.amazonaws.com/prod/events/${completeConfig.companyId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": completeConfig.apiKey,
        },
        body: JSON.stringify(eventsData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Error sending events data:", response.statusText);
          return;
        }
        return response.json();
      })
      .then((data) => {
        // Optional: Handle response data
      })
      .catch((error) => {
        console.error("Error sending events data:", error);
      });
  });

  // Assign to a global variable for potential reuse in other parts of your app
  window.nullRecorder = nullRecorder;
}

// Export relevant functionalities or objects
export { nullRecorder, EventListenerConfig };