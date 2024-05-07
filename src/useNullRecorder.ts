import { useEffect } from "react";

export const useNullRecorder = (config: {
  companyId: string;
  apiKey: string;
}) => {
  useEffect(() => {
    const loadRecorder = async () => {
      const { nullRecorder } = await import("./recorder");
      nullRecorder(config);
    };

    loadRecorder().catch(console.error);
  }, [config]);
};
