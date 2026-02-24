import { eq } from "drizzle-orm";
import { db } from "..";
import { adminTable } from "../schema";
import { verifyPassword } from "../crypto";

export async function dbGetAdminByEmailAndPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const userRows = await db
    .select()
    .from(adminTable)
    .where(eq(adminTable.email, email));
  const maybeUser = userRows[0];

  if (!maybeUser) {
    return undefined;
  }

  const passwordVerified = await verifyPassword(
    password,
    maybeUser.passwordHash,
  );
  if (!passwordVerified) {
    return undefined;
  }

  return maybeUser;
}
