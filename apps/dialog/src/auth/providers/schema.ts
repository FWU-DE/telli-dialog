import { z } from 'zod';

export const passwordSchema = z.string().min(8, {
  message: 'Das Passwort muss mindestens acht Zeichen lang sein',
});

export const emailSchema = z
  .string()
  .email({ message: 'Die eingegebene E-Mail-Adresse ist nicht gültig' });

export const firstNameSchema = z.string().min(1, { message: 'Vorname ist ein Pflichfeld' });
export const lastNameSchema = z.string().min(1, { message: 'Nachname ist ein Pflichfeld' });
export const nicknameSchema = z.string().nullable();

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
