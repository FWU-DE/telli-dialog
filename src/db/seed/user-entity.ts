import { dbCreateVidisUser, dbGetOrCreateVidisUser } from "../functions/vidis"

export async function insertDummyUser() {
    await dbCreateVidisUser({
        id: DUMMY_USER_ID,
        email: DUMMY_USER_EMAIL,
        firstName: DUMMY_USER_FIRST_NAME,
        lastName: DUMMY_USER_LAST_NAME
    })
}

export const DUMMY_USER_ID = "e7cdbdd7-f950-47c5-9955-61e5172b39b0"
const DUMMY_USER_EMAIL = "2950cc44-c056-43c3-80cc-207ebc2bce2f@vidis.schule"
const DUMMY_USER_FIRST_NAME = "DO_NOT_DELETE"
const DUMMY_USER_LAST_NAME = "GLOBAL_DEFAULT"