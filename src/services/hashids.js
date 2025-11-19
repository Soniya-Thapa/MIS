import Hashids from "hashids";

// "MIS_SECRET_KEY" is a salt, 10 is minimum length of the hash
const hashids = new Hashids(process.env.HASH_ID_SECRET_KEY, 10);

export default hashids;
