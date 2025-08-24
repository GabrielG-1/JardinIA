'use server';
/**
 * @fileOverview A server action to handle sending contact form emails.
 * In a real-world scenario, this would use a service like AWS SES, SendGrid, etc.
 */

import { z } from 'zod';

const SendContactEmailInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string(),
});

export type SendContactEmailInput = z.infer<typeof SendContactEmailInputSchema>;

// This is a server action that can be called directly from client components.
export async function sendContactEmail(input: SendContactEmailInput): Promise<{ success: boolean }> {
  try {
    // Input validation
    const validatedInput = SendContactEmailInputSchema.parse(input);

    const { name, email, phone, message } = validatedInput;
    const recipientEmail = process.env.CONTACT_FORM_RECIPIENT || 'test@example.com';

    // In a real application, you would integrate your email service provider here.
    // For example, using AWS SES, Nodemailer, SendGrid, etc.
    // This is a simulation for demonstration purposes.
    
    console.log('----- NUEVO MENSAJE DE CONTACTO -----');
    console.log(`De: ${name} <${email}>`);
    if (phone) {
      console.log(`Teléfono: ${phone}`);
    }
    console.log('Mensaje:');
    console.log(message);
    console.log('------------------------------------');
    console.log(`(Simulación) Correo enviado a: ${recipientEmail}`);

    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we'll just log to the console and return a success response.
    return { success: true };

  } catch (error) {
    console.error('Error al enviar el correo de contacto:', error);
    // You could perform more detailed error logging here
    throw new Error('El servidor no pudo procesar la solicitud.');
  }
}