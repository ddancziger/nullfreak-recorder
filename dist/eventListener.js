"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventListener = void 0;
let lastInteractionTime = 0;
let domChangedAfterInteraction = false;
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
        this.observer = new MutationObserver((mutations) => {
            const now = Date.now();
            if (now - lastInteractionTime <= 1000 && mutations.length > 0) {
                domChangedAfterInteraction = true;
                this.observer.disconnect();
            }
        });
        if (typeof window === "undefined") {
            return;
        }
        this.init();
    }
    static getInstance(config, sendBatchEvents) {
        if (!EventListener.instance) {
            EventListener.instance = new EventListener(config, sendBatchEvents);
        }
        return EventListener.instance;
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
        this.observer.observe(document.body, {
            childList: true,
            attributes: true,
            subtree: true,
        });
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
    checkIfParentHasInteractableChild(childs) {
        for (const child of childs) {
            if (child.nodeName === "INPUT") {
                return true;
            }
        }
        return false;
    }
    handleEvent(event) {
        let targetElement = event.target;
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
                    if (targetElement.tagName === "DIV" &&
                        domChangedAfterInteraction &&
                        !this.checkIfParentHasInteractableChild(targetElement.childNodes)) {
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
    extractEventData(event, element) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        if (!element) {
            return;
        }
        let attributes = this.getElementAttributes(element);
        let attributes_parent = this.getElementAttributes((_a = element.parentNode) === null || _a === void 0 ? void 0 : _a.parentElement);
        let attributes_parent_parent = this.getElementAttributes((_d = (_c = (_b = element.parentNode) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.parentNode) === null || _d === void 0 ? void 0 : _d.parentElement);
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
            eventType: event.type,
            timestamp: Date.now(),
            tagName: element.tagName,
            attributes: attributes,
            textContent: this.checkIfIsPIIDataAndClean((_e = element.textContent) === null || _e === void 0 ? void 0 : _e.trim()),
            pageUrl: window === null || window === void 0 ? void 0 : window.location.href,
            sessionId: (_f = this.config) === null || _f === void 0 ? void 0 : _f.sessionId,
            userId: (_g = this.config) === null || _g === void 0 ? void 0 : _g.userId,
            parent: {
                tagName: (_k = (_j = (_h = element.parentNode) === null || _h === void 0 ? void 0 : _h.parentElement) === null || _j === void 0 ? void 0 : _j.tagName) !== null && _k !== void 0 ? _k : null,
                attributes: attributes_parent,
                textContent: this.checkIfIsPIIDataAndClean((_m = (_l = element.parentNode.parentElement.textContent) === null || _l === void 0 ? void 0 : _l.trim()) !== null && _m !== void 0 ? _m : ""),
            },
            parentOfParent: {
                tagName: (_o = element.parentNode.parentElement.parentNode.parentElement.tagName) !== null && _o !== void 0 ? _o : null,
                attributes: attributes_parent_parent,
                textContent: this.checkIfIsPIIDataAndClean((_q = (_p = element.parentNode.parentElement.parentNode.parentElement.textContent) === null || _p === void 0 ? void 0 : _p.trim()) !== null && _q !== void 0 ? _q : ""),
            },
        };
        return eventData;
    }
    checkIfIsPIIDataAndClean(data) {
        let value = data;
        const creditCardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/;
        const fullNameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)+$/;
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        const phoneNumberRegex = /(?:\+?(\d{1,3}))?[-.\s]?(?:\((\d{1,4})\)|(\d{1,4}))?[-.\s]?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
        const addressRegex = /^[a-zA-Z0-9\s\-\#\.]+$/;
        const passportRegex = /^[A-Z0-9]+$/;
        if (creditCardRegex.test(data)) {
            value = "redacted-cc";
        }
        else if (fullNameRegex.test(data)) {
            value = "redacted-name";
        }
        else if (ssnRegex.test(data)) {
            value = "redacted-ssn";
        }
        else if (phoneNumberRegex.test(data)) {
            value = "redacted-phone";
        }
        else if (emailRegex.test(data)) {
            value = "redacted-email";
        }
        else if (dobRegex.test(data)) {
            value = "redacted-dob";
        }
        else if (addressRegex.test(data)) {
            value = "redacted-address";
        }
        else if (passportRegex.test(data)) {
            value = "redacted-passport";
        }
        return value;
    }
    findInteractableParent(element) {
        if (!element) {
            return null;
        }
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
        if (!element) {
            return false;
        }
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
        var _a;
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
        return Array.from((_a = element === null || element === void 0 ? void 0 : element.attributes) !== null && _a !== void 0 ? _a : []).reduce((attrs, attr) => {
            if (!blacklist.includes(attr.name)) {
                attrs[attr.name] = attr.value;
            }
            return attrs;
        }, {});
    }
}
exports.EventListener = EventListener;
EventListener.instance = null;
//# sourceMappingURL=eventListener.js.map