import { useEffect } from "react";

export const useNullRecorder = (config: {
  companyId: string;
  apiKey: string;
}) => {
  useEffect(() => {
    let loadRecorder = null;
    if (!loadRecorder) {
      loadRecorder = async () => {
        console.log("Starting recorder");
        const { nullRecorder } = await import("./recorder");
        nullRecorder(config);
      };

      loadRecorder().catch(console.error);
    }
  }, [config]);
};
