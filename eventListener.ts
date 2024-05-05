export interface EventListenerConfig {
  endpoint?: string;
  apiKey?: string;
  additionalInteractableTags?: string[];
  interactableAttribute?: string; // Custom attribute to mark interactable elements
  sessionId: string; // Now handled internally
  userId: string; // Now handled internally
}

let lastInteractionTime = 0;
let domChangedAfterInteraction = false;

const observer = new MutationObserver((mutations) => {
  const now = Date.now();
  if (now - lastInteractionTime <= 1000 && mutations.length > 0) {
    // Check for changes within 1 second of interaction
    console.log("Mutations", mutations);
    domChangedAfterInteraction = true;
    observer.disconnect(); // Optionally disconnect after detecting changes
  }
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  subtree: true,
});

export default class EventListener {
  private lastEvent = null;
  private eventQueue: any[] = [];
  private batchTimer: any;
  private batchSize: number = 10; // Number of events per batch
  private batchTime: number = 10000; // Time interval in milliseconds
  private debounceTimer: any = null;
  private defaultInteractableTags = [
    "BUTTON",
    "A",
    "INPUT",
    "SELECT",
    "TEXTAREA",
    "DIV",
  ];
  constructor(
    private config: EventListenerConfig,
    private sendBatchEvents: (events: any[]) => void
  ) {}

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    }, this.batchTime);
  }

  private flushEventQueue(): void {
    if (this.eventQueue.length > 0) {
      this.sendBatchEvents([...this.eventQueue]);
      this.eventQueue = [];
    }
  }

  public init(): void {
    const eventsToCapture = ["click", "input", "scroll"];
    eventsToCapture.forEach((eventType) => {
      document.body.addEventListener(
        eventType,
        this.handleEvent.bind(this),
        true
      );
    });
    // Listen on focus
    window.addEventListener("load", this.handlePageLoad.bind(this), true);
    window.addEventListener(
      "beforeunload",
      this.handelBeforeUnload.bind(this),
      true
    );
    this.startBatchTimer();
  }

  private handelBeforeUnload(): void {
    console.log("leaving the page!!");
    if (this.lastEvent) {
      console.log("sending event from beforeunload");
      this.eventQueue.push(this.lastEvent);
    }
  }
  private handlePageLoad(): void {
    // TODO NOT SENDING
    const pageLoadData = {
      eventType: "PAGE_LOAD",
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      tagName: null,
      attributes: {},
      textContent: "", // Capture the URL at load time
    };

    this.eventQueue.push(pageLoadData);
  }

  private sendEvent(eventData: any): void {
    this.eventQueue.push(eventData);
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEventQueue();
    }
  }
  private handleEvent(event: Event): void {
    let targetElement = event.target as HTMLElement;
    targetElement = this.findInteractableParent(targetElement);

    if (targetElement) {
      lastInteractionTime = Date.now();
      domChangedAfterInteraction = false;
      const eventData = this.extractEventData(event, targetElement);

      observer.observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true,
      });

      if (this.lastEvent && this.lastEvent.eventType !== eventData.eventType) {
        // console.log(`${targetElement.tagName} send last input event`);
        // let doc;
        // if (
        //   "class" in this.lastEvent.attributes &&
        //   this.lastEvent.attributes["class"]
        // ) {
        //   doc = document.getElementsByClassName(
        //     this.lastEvent.attributes["class"]
        //   );
        // } else if (
        //   "id" in this.lastEvent.attributes &&
        //   this.lastEvent.attributes["id"]
        // ) {
        //   doc = document.getElementById(this.lastEvent.attributes["id"]);
        // }
        // console.log("handeling last event", doc);
        this.sendEvent(this.lastEvent);
        this.lastEvent = null;
      }
      setTimeout(() => {
        if (this.isInteractable(targetElement)) {
          if (targetElement.tagName === "DIV" && domChangedAfterInteraction) {
            this.eventQueue.push(eventData);
          } else if (
            event.type === "input" &&
            targetElement.tagName === "INPUT"
          ) {
            this.lastEvent = this.extractEventData(event, targetElement);
          } else if (
            !["DIV"].includes(targetElement.tagName) &&
            event.type != "input"
          ) {
            this.sendEvent(eventData);
          }
        }
        observer.disconnect();
      }, 1000);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.lastEvent) {
          this.sendEvent(this.lastEvent);
          this.lastEvent = null;
        }
      }, 7000);
    }
  }

  private extractEventData(event: Event, element: HTMLElement) {
    const sensitiveTags = ["INPUT", "TEXTAREA"];
    let attributes = this.getElementAttributes(element);
    // Dynamically redact sensitive attributes based on their content
    Object.keys(attributes).forEach((attr) => {
      const value = attributes[attr];
      if (this.isEmail(value)) {
        attributes[attr] = "redacted-email";
      } else if (this.isPhoneNumber(value)) {
        attributes[attr] = "redacted-phone";
      } else if (this.isCreditCardNumber(value)) {
        attributes[attr] = "redacted-cc";
      }
    });

    const eventData = {
      eventType: event.type,
      timestamp: new Date().toUTCString(),
      tagName: element.tagName,
      attributes: attributes,
      textContent: element.textContent?.trim(),
      pageUrl: window.location.href,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
    };
    return eventData;
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isPhoneNumber(value: string): boolean {
    // Simple pattern for demonstration; consider more robust patterns for real applications
    return /(?:\+?(\d{1,3}))?[-.\s]?(?:\((\d{1,4})\)|(\d{1,4}))?[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/.test(
      value.replace(/\D/g, "")
    ); // Checks for strings of digits, ignoring non-digit characters
  }

  private isCreditCardNumber(value: string): boolean {
    // Basic check for 13 to 16 digits typical for credit cards
    return /\b\d{13,16}\b/.test(value.replace(/\D/g, ""));
  }

  private findInteractableParent(element: HTMLElement): HTMLElement {
    // Start at the current element and move up the DOM tree
    while (
      element &&
      element !== document.body &&
      element !== document.documentElement
    ) {
      if (this.isInteractable(element)) {
        return element;
      }
      element = element.parentElement as HTMLElement;
    }
    return null; // Return null if no interactable parent is found
  }

  private isInteractable(element: HTMLElement): boolean {
    const interactableTags = this.defaultInteractableTags.concat(
      this.config.additionalInteractableTags || []
    );
    if (interactableTags.includes(element.tagName)) {
      return true;
    }

    if (
      this.config.interactableAttribute &&
      element.hasAttribute(this.config.interactableAttribute)
    ) {
      return true;
    }

    return false;
  }

  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const blacklist = ["data-email", "data-cc-number"];
    return Array.from(element.attributes).reduce((attrs, attr) => {
      if (!blacklist.includes(attr.name)) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    }, {} as Record<string, string>);
  }
}
