"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let lastInteractionTime = 0;
let domChangedAfterInteraction = false;
const observer = new MutationObserver((mutations) => {
    const now = Date.now();
    if (now - lastInteractionTime <= 1000 && mutations.length > 0) {
        domChangedAfterInteraction = true;
        observer.disconnect();
    }
});
observer.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true,
});
class EventListener {
    constructor(config, sendBatchEvents) {
        this.config = config;
        this.sendBatchEvents = sendBatchEvents;
        this.lastEvent = null;
        this.eventQueue = [];
        this.batchSize = 10;
        this.batchTime = 10000;
        this.debounceTimer = null;
        this.defaultInteractableTags = [
            "BUTTON",
            "A",
            "INPUT",
            "SELECT",
            "TEXTAREA",
            "DIV",
        ];
    }
    startBatchTimer() {
        this.batchTimer = setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEventQueue();
            }
        }, this.batchTime);
    }
    flushEventQueue() {
        if (this.eventQueue.length > 0) {
            this.sendBatchEvents([...this.eventQueue]);
            this.eventQueue = [];
        }
    }
    init() {
        const eventsToCapture = ["click", "input", "scroll"];
        eventsToCapture.forEach((eventType) => {
            document.body.addEventListener(eventType, this.handleEvent.bind(this), true);
        });
        window.addEventListener("load", this.handlePageLoad.bind(this), true);
        window.addEventListener("beforeunload", this.handelBeforeUnload.bind(this), true);
        this.startBatchTimer();
    }
    handelBeforeUnload() {
        if (this.lastEvent) {
            this.eventQueue.push(this.lastEvent);
        }
    }
    handlePageLoad() {
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
    sendEvent(eventData) {
        this.eventQueue.push(eventData);
        if (this.eventQueue.length >= this.batchSize) {
            this.flushEventQueue();
        }
    }
    handleEvent(event) {
        let targetElement = event.target;
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
                this.sendEvent(this.lastEvent);
                this.lastEvent = null;
            }
            setTimeout(() => {
                if (this.isInteractable(targetElement)) {
                    if (targetElement.tagName === "DIV" && domChangedAfterInteraction) {
                        this.eventQueue.push(eventData);
                    }
                    else if (event.type === "input" &&
                        targetElement.tagName === "INPUT") {
                        this.lastEvent = this.extractEventData(event, targetElement);
                    }
                    else if (!["DIV"].includes(targetElement.tagName) &&
                        event.type != "input") {
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
            }, 15000);
        }
    }
    extractEventData(event, element) {
        var _a;
        let attributes = this.getElementAttributes(element);
        Object.keys(attributes).forEach((attr) => {
            const value = attributes[attr];
            if (this.isEmail(value)) {
                attributes[attr] = "redacted-email";
            }
            else if (this.isPhoneNumber(value)) {
                attributes[attr] = "redacted-phone";
            }
            else if (this.isCreditCardNumber(value)) {
                attributes[attr] = "redacted-cc";
            }
        });
        const eventData = {
            eventType: event.type,
            timestamp: Date.now(),
            tagName: element.tagName,
            attributes: attributes,
            textContent: (_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim(),
            pageUrl: window.location.href,
            sessionId: this.config.sessionId,
            userId: this.config.userId,
        };
        return eventData;
    }
    isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    isPhoneNumber(value) {
        return /(?:\+?(\d{1,3}))?[-.\s]?(?:\((\d{1,4})\)|(\d{1,4}))?[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/.test(value.replace(/\D/g, ""));
    }
    isCreditCardNumber(value) {
        return /\b\d{13,16}\b/.test(value.replace(/\D/g, ""));
    }
    findInteractableParent(element) {
        while (element &&
            element !== document.body &&
            element !== document.documentElement) {
            if (this.isInteractable(element)) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }
    isInteractable(element) {
        const interactableTags = this.defaultInteractableTags.concat(this.config.additionalInteractableTags || []);
        if (interactableTags.includes(element.tagName)) {
            return true;
        }
        if (this.config.interactableAttribute &&
            element.hasAttribute(this.config.interactableAttribute)) {
            return true;
        }
        return false;
    }
    getElementAttributes(element) {
        const blacklist = ["data-email", "data-cc-number"];
        return Array.from(element.attributes).reduce((attrs, attr) => {
            if (!blacklist.includes(attr.name)) {
                attrs[attr.name] = attr.value;
            }
            return attrs;
        }, {});
    }
}
exports.default = EventListener;
//# sourceMappingURL=eventListener.js.map