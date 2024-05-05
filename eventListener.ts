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
    console.log('Mutations', mutations);
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
  private lastEvent: any = null;
  private defaultInteractableTags = [
    'BUTTON',
    'A',
    'INPUT',
    'SELECT',
    'TEXTAREA',
    'DIV',
  ];

  private eventQueue: any[] = [];
  private debounceTimer: any = 1000;

  constructor(
    private config: EventListenerConfig,
    private sendEvent: (eventData: any) => void,
  ) {}

  public init(): void {
    const eventsToCapture = ['click', 'input', 'scroll'];
    eventsToCapture.forEach((eventType) => {
      document.body.addEventListener(
        eventType,
        this.handleEvent.bind(this),
        true,
      );
    });
    window.addEventListener('load', this.handlePageLoad.bind(this), true);
    window.addEventListener(
      'beforeunload',
      this.handelBeforeUnload.bind(this),
      true,
    );
  }

  private handelBeforeUnload(): void {
    console.log('leaving the page!!');
    if (this.lastEvent) {
      console.log('sending event from beforeunload');
      this.sendEvent(this.lastEvent);
    }
  }
  private handlePageLoad(): void {
    // TODO NOT SENDING
    const pageLoadData = {
      eventType: 'PAGE_LOAD',
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      tagName: null,
      attributes: {},
      textContent: '', // Capture the URL at load time
    };

    this.sendEvent(pageLoadData);
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

      // console.log(
      //   `${this.lastEvent?.eventType} last event - now event ${eventData.eventType}`,
      // );
      if (this.lastEvent && this.lastEvent.eventType !== eventData.eventType) {
        // console.log(`${targetElement.tagName} send last input event`);
        let doc;
        if (
          'class' in this.lastEvent.attributes &&
          this.lastEvent.attributes['class']
        ) {
          doc = document.getElementsByClassName(
            this.lastEvent.attributes['class'],
          );
        } else if (
          'id' in this.lastEvent.attributes &&
          this.lastEvent.attributes['id']
        ) {
          doc = document.getElementById(this.lastEvent.attributes['id']);
        }
        console.log('handeling last event', doc);
        this.sendEvent(this.lastEvent);
        this.lastEvent = null;
      }
      setTimeout(() => {
        if (this.isInteractable(targetElement)) {
          if (targetElement.tagName === 'DIV' && domChangedAfterInteraction) {
            this.sendEvent(eventData);
            // console.log(
            //   `${targetElement.tagName} dom changed after interaction`,
            // );
          } else if (
            event.type === 'input' &&
            targetElement.tagName === 'INPUT'
          ) {
            // clearTimeout(this.debounceTimer);
            // Debounce input events more timmer checking with 5 seconds
            // console.log(`${targetElement.tagName} wait for next event`);
            this.lastEvent = this.extractEventData(event, targetElement);
            // this.debounceTimer = setTimeout(() => {
            //   this.sendEvent(this.extractEventData(event, targetElement));
            // }, 5000); // 500 ms debounce period
          } else if (
            !['DIV'].includes(targetElement.tagName) &&
            event.type != 'input'
          ) {
            // console.log(`${targetElement.tagName} sending event`);
            this.sendEvent(eventData);
          }
        }
        observer.disconnect();
      }, 1000);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.lastEvent) {
          // console.log(
          //   `${targetElement.tagName} send last input event after timeout`,
          // );
          this.sendEvent(this.lastEvent);
          this.lastEvent = null;
        }
      }, 10000);
    }
  }

  private extractEventData(event: Event, element: HTMLElement) {
    const eventData = {
      eventType: event.type,
      timestamp: new Date().toUTCString(),
      tagName: element.tagName,
      attributes: this.getElementAttributes(element),
      textContent: element.textContent?.trim(),
      pageUrl: window.location.href,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
    };
    return eventData;
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
      this.config.additionalInteractableTags || [],
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
    return Array.from(element.attributes).reduce((attrs, attr) => {
      attrs[attr.name] = attr.value;
      return attrs;
    }, {} as Record<string, string>);
  }
}
