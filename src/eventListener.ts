interface EventListenerConfig {
  companyId: string;
  endpoint?: string;
  apiKey: string;
  additionalInteractableTags?: string[];
  interactableAttribute?: string; // Custom attribute to mark interactable elements
  sessionId: string; // Now handled internally
  userId: string; // Now handled internally
}

let lastInteractionTime = 0;
let domChangedAfterInteraction = false;

class EventListener {
  private static instance: EventListener | null = null;
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
  private constructor(
    private config: EventListenerConfig,
    private sendBatchEvents: (events: any[]) => void
  ) {
    if (typeof window === "undefined") {
      // Avoid initializing in server-side environments
      return;
    }
    this.init();
  }

  public static getInstance(
    config: EventListenerConfig,
    sendBatchEvents: (events: any[]) => void
  ): EventListener {
    if (!EventListener.instance) {
      EventListener.instance = new EventListener(config, sendBatchEvents);
    }
    return EventListener.instance;
  }

  private observer: MutationObserver = new MutationObserver((mutations) => {
    const now = Date.now();
    if (now - lastInteractionTime <= 1000 && mutations.length > 0) {
      // Check for changes within 1 second of interaction
      domChangedAfterInteraction = true;
      this.observer?.disconnect(); // Optionally disconnect after detecting changes
    }
  });

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
    this.observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
    });
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
    if (this.lastEvent) {
      this.eventQueue.push(this.lastEvent);
    }
  }
  private handlePageLoad(): void {
    const pageLoadData = {
      eventType: "pageLoad",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      tagName: null,
      attributes: {},
      textContent: "",
    };

    this.eventQueue.push(pageLoadData);
  }

  private sendEvent(eventData: any): void {
    this.eventQueue.push(eventData);
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEventQueue();
    }
  }

  private checkIfParentHasInteractableChild(
    childs: NodeListOf<ChildNode>
  ): boolean {
    for (const child of childs) {
      if (child?.nodeName === "INPUT") {
        return true;
      }
    }
    return false;
  }
  private handleEvent(event: Event): void {
    let targetElement = event?.target as HTMLElement;
    targetElement = this.findInteractableParent(targetElement);

    if (targetElement) {
      lastInteractionTime = Date.now();
      domChangedAfterInteraction = false;
      const eventData = this.extractEventData(event, targetElement);

      this.observer.observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true,
      });

      if (this.lastEvent && this.lastEvent.eventType !== eventData.eventType) {
        this.sendEvent(this.lastEvent);
        this.lastEvent = null;
      }
      setTimeout(() => {
        if (this.isInteractable(targetElement)) {
          if (
            targetElement.tagName === "DIV" &&
            domChangedAfterInteraction &&
            !this.checkIfParentHasInteractableChild(targetElement.childNodes)
          ) {
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
        this.observer.disconnect();
      }, 1000);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.lastEvent) {
          this.sendEvent(this.lastEvent);
          this.lastEvent = null;
        }
      }, 15000);
    }
  }

  private extractEventData(event: Event, element: HTMLElement) {
    if (!element) {
      return;
    }
    let attributes = this.getElementAttributes(element);
    let attributes_parent = this.getElementAttributes(
      element.parentNode?.parentElement
    );
    let attributes_parent_parent = this.getElementAttributes(
      element.parentNode?.parentElement?.parentNode?.parentElement
    );
    // Dynamically redact sensitive attributes based on their content
    Object.keys(attributes).forEach((attr) => {
      if (attr === "value") {
        const value = attributes[attr];
        attributes[attr] = this.checkIfIsPIIDataAndClean(value);
      }
    });

    Object.keys(attributes_parent).forEach((attr) => {
      if (attr === "value") {
        const value = attributes_parent[attr];
        attributes_parent[attr] = this.checkIfIsPIIDataAndClean(value);
      }
    });

    Object.keys(attributes_parent_parent).forEach((attr) => {
      if (attr === "value") {
        const value = attributes_parent_parent[attr];
        attributes_parent_parent[attr] = this.checkIfIsPIIDataAndClean(value);
      }
    });

    const eventData = {
      eventType: event?.type,
      timestamp: Date.now(),
      tagName: element?.tagName ?? null,
      attributes: attributes,
      textContent: this.checkIfIsPIIDataAndClean(
        element?.textContent?.trim() ?? ""
      ),
      pageUrl: window?.location?.href ?? "",
      sessionId: this.config?.sessionId ?? "",
      userId: this.config?.userId ?? "",
      parent: {
        tagName: element.parentNode?.parentElement?.tagName ?? null,
        attributes: attributes_parent,
        textContent: this.checkIfIsPIIDataAndClean(
          element?.parentNode?.parentElement?.textContent?.trim() ?? ""
        ),
      },
      parentOfParent: {
        tagName:
          element?.parentNode?.parentElement?.parentNode?.parentElement
            ?.tagName ?? null,
        attributes: attributes_parent_parent,
        textContent: this.checkIfIsPIIDataAndClean(
          element?.parentNode?.parentElement?.parentNode?.parentElement?.textContent?.trim() ??
            ""
        ),
      },
    };
    return eventData;
  }

  private checkIfIsPIIDataAndClean(data: any): string {
    let value = data;
    const creditCardRegex =
      /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/;

    const fullNameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)+$/;
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    const phoneNumberRegex =
      /(?:\+?(\d{1,3}))?[-.\s]?(?:\((\d{1,4})\)|(\d{1,4}))?[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    const addressRegex = /^[a-zA-Z0-9\s\-\#\.]+$/;
    const passportRegex = /^[A-Z0-9]+$/;
    if (creditCardRegex.test(data)) {
      value = "redacted-cc";
    } else if (ssnRegex.test(data)) {
      value = "redacted-ssn";
    } else if (phoneNumberRegex.test(data)) {
      value = "redacted-phone";
    } else if (emailRegex.test(data)) {
      value = "redacted-email";
    } else if (dobRegex.test(data)) {
      value = "redacted-dob";
    } else if (addressRegex.test(data)) {
      value = "redacted-address";
    }
    return value;
  }

  private findInteractableParent(element: HTMLElement): HTMLElement {
    if (!element) {
      return null;
    }
    // Start at the current element and move up the DOM tree
    while (
      element &&
      element !== document?.body &&
      element !== document?.documentElement
    ) {
      if (this.isInteractable(element)) {
        return element;
      }
      element = element?.parentElement as HTMLElement;
    }
    return null; // Return null if no interactable parent is found
  }

  private isInteractable(element: HTMLElement): boolean {
    if (!element) {
      return false;
    }
    const interactableTags = this.defaultInteractableTags.concat(
      this.config.additionalInteractableTags || []
    );
    if (interactableTags.includes(element.tagName)) {
      return true;
    }

    if (
      this.config.interactableAttribute &&
      element?.hasAttribute(this.config.interactableAttribute)
    ) {
      return true;
    }

    return false;
  }

  private getElementAttributes(element: HTMLElement): Record<string, string> {
    const blacklist = [
      "data-email",
      "data-cc-number",
      "data-social-security-number",
      "data-account-number",
      "data-gender",
      "data-birth-date",
      "data-birth-date",
      "data-birth-date",
      "data-full-name",
    ];
    if (!element) {
      return {};
    }
    return Array.from(element?.attributes ?? []).reduce((attrs, attr) => {
      if (!blacklist.includes(attr?.name)) {
        attrs[attr.name] = attr?.value ?? "";
      }
      return attrs;
    }, {} as Record<string, string>);
  }
}

export { EventListener, EventListenerConfig };
