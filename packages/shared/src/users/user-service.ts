import { UserModel, userSchema } from '@shared/auth/user-model';
import { dbUpdateLastUsedModelByUserId } from '@shared/db/functions/user';

/**
 * Stores the last used model of the user in the database
 * and returns the updated user
 */
export async function setLastUsedModelOfUser({
  userId,
  modelName,
}: {
  userId: string;
  modelName: string;
}): Promise<UserModel> {
  const updatedUser = await dbUpdateLastUsedModelByUserId({ userId, modelName });
  return userSchema.parse(updatedUser);
}
