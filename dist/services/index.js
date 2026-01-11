"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceService = exports.spaceService = exports.StorageError = exports.storage = void 0;
var storage_js_1 = require("./storage.js");
Object.defineProperty(exports, "storage", { enumerable: true, get: function () { return storage_js_1.storage; } });
Object.defineProperty(exports, "StorageError", { enumerable: true, get: function () { return storage_js_1.StorageError; } });
var space_js_1 = require("./space.js");
Object.defineProperty(exports, "spaceService", { enumerable: true, get: function () { return space_js_1.spaceService; } });
Object.defineProperty(exports, "SpaceService", { enumerable: true, get: function () { return space_js_1.SpaceService; } });
__exportStar(require("./context-builder.js"), exports);
__exportStar(require("./ai-provider.js"), exports);
__exportStar(require("./memory-extractor.js"), exports);
__exportStar(require("./chat.js"), exports);
//# sourceMappingURL=index.js.map