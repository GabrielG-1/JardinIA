'use server';
/**
 * @fileOverview A server action to handle saving contact form submissions to Firestore.
 * This is designed to work with the "Trigger Email" Firebase Extension.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SendContactEmailInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string(),
});

export type SendContactEmailInput = z.infer<typeof SendContactEmailInputSchema>;

// This server action writes the contact details to a 'mail' collection in Firestore.
// The "Trigger Email" Firebase Extension can then be configured to listen to this
// collection and send an email automatically.
export async function sendContactEmail(input: SendContactEmailInput): Promise<{ success: boolean }> {
  try {
    // Input validation
    const validatedInput = SendContactEmailInputSchema.parse(input);

    const { name, email, phone, message } = validatedInput;
    
    // Add a new document to the 'mail' collection
    await addDoc(collection(db, "mail"), {
      to: [process.env.CONTACT_FORM_RECIPIENT || 'test@example.com'], // The recipient email address
      message: {
        subject: `Nuevo mensaje de contacto de ${name}`,
        html: `
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
          <hr>
          <p><strong>Mensaje:</strong></p>
          <p>${message}</p>
        `,
      },
      createdAt: serverTimestamp(),
    });

    return { success: true };

  } catch (error) {
    console.error('Error al guardar el mensaje de contacto:', error);
    // You could perform more detailed error logging here
    throw new Error('El servidor no pudo procesar la solicitud.');
  }
}

    