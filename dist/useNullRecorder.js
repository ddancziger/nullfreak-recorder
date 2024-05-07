"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNullRecorder = void 0;
const react_1 = require("react");
const useNullRecorder = (config) => {
    (0, react_1.useEffect)(() => {
        let loadRecorder = null;
        if (!loadRecorder) {
            loadRecorder = async () => {
                console.log("Starting recorder");
                const { nullRecorder } = await Promise.resolve().then(() => require("./recorder"));
                nullRecorder(config);
            };
            loadRecorder().catch(console.error);
        }
    }, [config]);
};
exports.useNullRecorder = useNullRecorder;
//# sourceMappingURL=useNullRecorder.js.map