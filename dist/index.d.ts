import EventListener, { EventListenerConfig } from './EventListener';
declare global {
    interface Window {
        nullRecorder: any;
    }
}
declare const nullRecorder: (config: any) => void;
export { nullRecorder, EventListener, EventListenerConfig };
