
import crypto from "crypto";

// Generate a random 32-byte string in hex
const salt = crypto.randomBytes(32).toString("hex");
console.log(salt);