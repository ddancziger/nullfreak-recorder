import { EventListenerConfig } from "./eventListener";
declare global {
    interface Window {
        nullRecorder: any;
    }
}
declare const nullRecorder: (config: any) => void;
export { nullRecorder, EventListenerConfig };
