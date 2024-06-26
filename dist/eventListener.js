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
            "LI",
            "OPTION",
            "SELECT",
        ];
        this.observer = new MutationObserver((mutations) => {
            var _a;
            const now = Date.now();
            if (now - lastInteractionTime <= 1000 && mutations.length > 0) {
                domChangedAfterInteraction = true;
                (_a = this.observer) === null || _a === void 0 ? void 0 : _a.disconnect();
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
        var _a, _b, _c, _d;
        const pageLoadData = {
            eventType: "pageLoad",
            timestamp: Date.now(),
            pageUrl: window.location.href,
            tagName: null,
            attributes: {},
            textContent: "",
            htmlSnapshot: "",
            userId: (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.userId) !== null && _b !== void 0 ? _b : "",
            sessionId: (_d = (_c = this.config) === null || _c === void 0 ? void 0 : _c.sessionId) !== null && _d !== void 0 ? _d : "",
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
            if ((child === null || child === void 0 ? void 0 : child.nodeName) === "INPUT") {
                return true;
            }
        }
        return false;
    }
    handleEvent(event) {
        let targetElement = event === null || event === void 0 ? void 0 : event.target;
        const isInShadowDOM = (element) => {
            while (element && element.parentNode) {
                if (element.parentNode instanceof ShadowRoot) {
                    return true;
                }
                element = element.parentNode;
            }
            return false;
        };
        const isShadow = isInShadowDOM(targetElement);
        targetElement = this.findInteractableParent(targetElement);
        if (targetElement) {
            lastInteractionTime = Date.now();
            domChangedAfterInteraction = false;
            const eventData = this.extractEventData(event, targetElement, isShadow);
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
                    if ((targetElement === null || targetElement === void 0 ? void 0 : targetElement.tagName) === "DIV" &&
                        domChangedAfterInteraction &&
                        !this.checkIfParentHasInteractableChild(targetElement.childNodes)) {
                        this.eventQueue.push(eventData);
                    }
                    else if ((event === null || event === void 0 ? void 0 : event.type) === "input" &&
                        (targetElement === null || targetElement === void 0 ? void 0 : targetElement.tagName) === "INPUT") {
                        this.lastEvent = this.extractEventData(event, targetElement, isShadow);
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
    extractEventData(event, element, isInShadowDOM = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
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
        let index;
        if (element.parentNode) {
            const children = Array.from(element.parentNode.children);
            index = children.indexOf(element) + 1;
        }
        const eventData = {
            eventType: event === null || event === void 0 ? void 0 : event.type,
            timestamp: Date.now(),
            tagName: (_f = (_e = element === null || element === void 0 ? void 0 : element.tagName) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== null && _f !== void 0 ? _f : null,
            attributes: attributes,
            textContent: (_h = (_g = element === null || element === void 0 ? void 0 : element.textContent) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : "",
            position: index,
            pageUrl: (_k = (_j = window === null || window === void 0 ? void 0 : window.location) === null || _j === void 0 ? void 0 : _j.href) !== null && _k !== void 0 ? _k : "",
            sessionId: (_m = (_l = this.config) === null || _l === void 0 ? void 0 : _l.sessionId) !== null && _m !== void 0 ? _m : "",
            userId: (_p = (_o = this.config) === null || _o === void 0 ? void 0 : _o.userId) !== null && _p !== void 0 ? _p : "",
            isInShadowDOM,
            parent: {
                tagName: (_s = (_r = (_q = element.parentNode) === null || _q === void 0 ? void 0 : _q.parentElement) === null || _r === void 0 ? void 0 : _r.tagName.toLowerCase()) !== null && _s !== void 0 ? _s : null,
                attributes: attributes_parent,
                textContent: (_w = (_v = (_u = (_t = element === null || element === void 0 ? void 0 : element.parentNode) === null || _t === void 0 ? void 0 : _t.parentElement) === null || _u === void 0 ? void 0 : _u.textContent) === null || _v === void 0 ? void 0 : _v.trim()) !== null && _w !== void 0 ? _w : "",
            },
            parentOfParent: {
                tagName: (_1 = (_0 = (_z = (_y = (_x = element === null || element === void 0 ? void 0 : element.parentNode) === null || _x === void 0 ? void 0 : _x.parentElement) === null || _y === void 0 ? void 0 : _y.parentNode) === null || _z === void 0 ? void 0 : _z.parentElement) === null || _0 === void 0 ? void 0 : _0.tagName.toLowerCase()) !== null && _1 !== void 0 ? _1 : null,
                attributes: attributes_parent_parent,
                textContent: (_7 = (_6 = (_5 = (_4 = (_3 = (_2 = element === null || element === void 0 ? void 0 : element.parentNode) === null || _2 === void 0 ? void 0 : _2.parentElement) === null || _3 === void 0 ? void 0 : _3.parentNode) === null || _4 === void 0 ? void 0 : _4.parentElement) === null || _5 === void 0 ? void 0 : _5.textContent) === null || _6 === void 0 ? void 0 : _6.trim()) !== null && _7 !== void 0 ? _7 : "",
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
        return value;
    }
    findInteractableParent(element) {
        if (!element) {
            return null;
        }
        while (element &&
            element !== (document === null || document === void 0 ? void 0 : document.body) &&
            element !== (document === null || document === void 0 ? void 0 : document.documentElement)) {
            if (this.isInteractable(element)) {
                return element;
            }
            element = element === null || element === void 0 ? void 0 : element.parentElement;
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
            (element === null || element === void 0 ? void 0 : element.hasAttribute(this.config.interactableAttribute))) {
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
            var _a;
            if (!blacklist.includes(attr === null || attr === void 0 ? void 0 : attr.name)) {
                attrs[attr.name] = (_a = attr === null || attr === void 0 ? void 0 : attr.value) !== null && _a !== void 0 ? _a : "";
            }
            return attrs;
        }, {});
    }
}
exports.EventListener = EventListener;
EventListener.instance = null;
//# sourceMappingURL=eventListener.js.map