"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNullRecorder = void 0;
const react_1 = require("react");
let loadRecorder = null;
const useNullRecorder = (config) => {
    (0, react_1.useEffect)(() => {
        if (!loadRecorder) {
            loadRecorder = async () => {
                const { nullRecorder } = await Promise.resolve().then(() => require("./recorder"));
                nullRecorder(config);
            };
            loadRecorder().catch(console.error);
        }
    }, [config]);
};
exports.useNullRecorder = useNullRecorder;
//# sourceMappingURL=useNullRecorder.js.map