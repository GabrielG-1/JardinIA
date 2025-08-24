'use server';
/**
 * @fileOverview A server action to handle sending contact form submissions via email using Nodemailer.
 * This approach is compatible with hosting environments that allow server-side code,
 * like Firebase App Hosting, and does not require Firebase Extensions.
 */

import { z } from 'zod';
import nodemailer from 'nodemailer';

// --- Input Schema Definition ---
const SendContactEmailInputSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('El correo electrónico no es válido.'),
  phone: z.string().optional(),
  message: z.string().min(10, 'El mensaje es demasiado corto.'),
});

export type SendContactEmailInput = z.infer<typeof SendContactEmailInputSchema>;


/**
 * Sends a contact form email using Nodemailer.
 * Reads SMTP configuration from environment variables.
 * 
 * @param input - The validated form data.
 * @returns An object indicating success or failure.
 */
export async function sendContactEmail(input: SendContactEmailInput): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Validate input data against the schema
    const validatedInput = SendContactEmailInputSchema.parse(input);
    const { name, email, phone, message } = validatedInput;

    // 2. Create a transporter object using SMTP transport
    //    It's crucial to use environment variables for security.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password or app-specific password
      },
    });

    // 3. Define email options
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER}>`, // Sender address (shows user's name but sends from your address)
      replyTo: email, // Set the user's email as the reply-to address
      to: process.env.CONTACT_FORM_RECIPIENT, // The email address that will receive the form submissions
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #6B8E23;">Nuevo Mensaje de Contacto</h2>
          <p>Has recibido un nuevo mensaje a través del formulario de contacto de JardínIA.</p>
          <hr>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
          <h3 style="color: #6B8E23;">Mensaje:</h3>
          <div style="padding: 10px; border-left: 3px solid #E07A5F; background-color: #f9f9f9;">
            <p style="margin: 0;">${message}</p>
          </div>
          <hr>
          <p style="font-size: 0.8em; color: #777;">Este correo fue enviado desde el formulario de contacto de tu sitio web.</p>
        </div>
      `,
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);

    console.log('Contact email sent successfully.');
    return { success: true };

  } catch (error) {
    console.error('Error sending contact email:', error);

    // Differentiate between validation and server errors
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Datos del formulario no válidos.' };
    }
    
    // For other errors (like SMTP issues), return a generic server error message
    return { success: false, error: 'El servidor no pudo procesar la solicitud de envío de correo.' };
  }
}
