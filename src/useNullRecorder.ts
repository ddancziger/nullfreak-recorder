import { useEffect } from "react";
let loadRecorder = null;
export const useNullRecorder = (config: {
  companyId: string;
  apiKey: string;
}) => {
  useEffect(() => {
    if (!loadRecorder) {
      loadRecorder = async () => {
        const { nullRecorder } = await import("./recorder");
        nullRecorder(config);
      };

      loadRecorder().catch(console.error);
    }
  }, [config]);
};
