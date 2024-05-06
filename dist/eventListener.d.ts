export interface EventListenerConfig {
    companyId: string;
    endpoint?: string;
    apiKey: string;
    additionalInteractableTags?: string[];
    interactableAttribute?: string;
    sessionId: string;
    userId: string;
}
export default class EventListener {
    private config;
    private sendBatchEvents;
    private lastEvent;
    private eventQueue;
    private batchTimer;
    private batchSize;
    private batchTime;
    private debounceTimer;
    private defaultInteractableTags;
    constructor(config: EventListenerConfig, sendBatchEvents: (events: any[]) => void);
    private startBatchTimer;
    private flushEventQueue;
    init(): void;
    private handelBeforeUnload;
    private handlePageLoad;
    private sendEvent;
    private handleEvent;
    private extractEventData;
    private isEmail;
    private isPhoneNumber;
    private isCreditCardNumber;
    private findInteractableParent;
    private isInteractable;
    private getElementAttributes;
}
