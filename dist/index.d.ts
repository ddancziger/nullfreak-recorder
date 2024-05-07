import { EventListenerConfig } from "./eventListener";
declare global {
    interface Window {
        nullRecorder?: typeof nullRecorder;
    }
}
declare function nullRecorder(config: Partial<EventListenerConfig> & {
    companyId: string;
    apiKey: string;
}): void;
export { nullRecorder, EventListenerConfig };
