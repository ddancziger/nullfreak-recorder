import { useEffect } from "react";

let loadRecorder: (() => Promise<void>) | null = null;

export const useNullRecorder = (
  config: {
    companyId: string;
    apiKey: string;
    enabled: boolean;
  } = {
    companyId: "",
    apiKey: "",
    enabled: true,
  }
) => {
  useEffect(() => {
    if (config.enabled && !loadRecorder) {
      const nullRecorderConfig = {
        companyId: config.companyId,
        apiKey: config.apiKey,
      };
      loadRecorder = async () => {
        const { nullRecorder } = await import("./recorder");
        nullRecorder(nullRecorderConfig);
      };

      loadRecorder().catch(console.error);
    }
  }, [config]);
};
