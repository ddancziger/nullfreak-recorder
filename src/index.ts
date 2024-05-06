// Import dependencies if any
import EventListener, { EventListenerConfig } from './EventListener';

// Declare global enhancements or modifications if necessary
declare global {
  interface Window {
    nullRecorder: any;
  }
}

// Utility function to get a session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = "sess-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

// Utility function to get a user ID
function getUserId() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = "user-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// The main function that initializes and configures the event listener
const nullRecorder = (config) => {
  config = {
    ...config,
    sessionId: getSessionId(),
    userId: getUserId(),
  };

  const listener = new EventListener(config, (eventsData) => {
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
    .then(response => {
      if (!response.ok) {
        return;
      }
      return response.json();
    })
    .then(data => {
      // Handle response data if necessary
    })
    .catch(error => {
      console.error("Error sending events data:", error);
    });
  });
  listener.init();
};

// Export relevant functionalities or objects
export { nullRecorder, EventListener, EventListenerConfig };