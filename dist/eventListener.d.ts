interface EventListenerConfig {
    companyId: string;
    endpoint?: string;
    apiKey: string;
    additionalInteractableTags?: string[];
    interactableAttribute?: string;
    sessionId: string;
    userId: string;
}
declare class EventListener {
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
    private checkIfParentHasInteractableChild;
    private handleEvent;
    private extractEventData;
    private checkIfIsPIIDataAndClean;
    private findInteractableParent;
    private isInteractable;
    private getElementAttributes;
}
export { EventListener, EventListenerConfig };
