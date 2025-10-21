import {TextEncoder, TextDecoder} from "node:util";

//@ts-expect-error
global.TextEncoder = TextEncoder;
//@ts-expect-error
global.TextDecoder = TextDecoder;
