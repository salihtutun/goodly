// Jest setup — polyfills for jsdom environment (runs BEFORE test framework)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
