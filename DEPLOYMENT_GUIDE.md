# Guía de Despliegue

¡Felicidades! Tu aplicación está lista para ser publicada.

Antes de desplegar, es crucial que configures tus "secretos" (claves de API, contraseñas) de forma segura en tu proveedor de hosting y en tus reglas de Firestore.

## 1. Configuración de Reglas de Firestore

Para que los administradores puedan moderar contenido, debes editar tus reglas de seguridad de Firestore.

1.  Abre el archivo `firestore.rules`.
2.  Busca la línea que contiene `let adminEmails = [...]`.
3.  **Reemplaza los correos de ejemplo** (`'admin1@example.com', 'admin2@example.com'`) con los correos electrónicos reales de tus administradores. **Asegúrate de que los correos estén en minúsculas y no tengan espacios extra.**

```javascript
// firestore.rules

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Lista de correos de administradores.
    // REEMPLAZA ESTO CON TUS CORREOS REALES EN MINÚSCULAS
    let adminEmails = ['programaciongabriel2025@gmail.com'];
    
    // Función para verificar si el usuario es un administrador
    function isAdmin() {
      return request.auth != null && request.auth.token.email.lower() in adminEmails;
    }

    // Reglas para la colección 'catalog'
    match /catalog/{categoryId} {
      allow read: if true;
      allow write: if isAdmin(); // Solo los admins pueden crear, actualizar o borrar productos.
    }
    
    // Reglas para la colección de consejos de la comunidad
    match /community-tips/{tipId} {
      allow read: if resource.data.isApproved == true || isAdmin();
      allow create: if true; // Cualquiera puede enviar un consejo para moderación
      allow update: if request.auth != null || isAdmin(); // Usuarios logueados pueden añadir respuestas, admins pueden modificar
      allow delete: if isAdmin(); // Solo los admins pueden borrar el consejo principal
    }
  }
}
```

Una vez editado, estas reglas se desplegarán automáticamente con tu aplicación.

## 2. Configuración de Variables de Entorno

Tu aplicación necesita las siguientes variables de entorno para funcionar correctamente en producción. Debes configurarlas en la sección de "Environment Variables" o "Secret Management" de tu proveedor de hosting (por ejemplo, Firebase App Hosting, Vercel, Netlify, etc.).

1.  **`GEMINI_API_KEY`**: Tu clave de API para los servicios de Google AI (Gemini).
2.  **`SMTP_HOST`**: El servidor de tu proveedor de correo (ej: `smtp.gmail.com`).
3.  **`SMTP_PORT`**: El puerto de tu servidor de correo (ej: `587`).
4.  **`SMTP_USER`**: Tu nombre de usuario o correo electrónico para enviar emails.
5.  **`SMTP_PASS`**: La contraseña de tu correo o una "contraseña de aplicación" específica.
6.  **`CONTACT_FORM_RECIPIENT`**: El correo que recibirá los mensajes del formulario de contacto.
7.  **`NEXT_PUBLIC_ADMIN_EMAILS`**: Una lista de correos electrónicos de administradores, **separados por comas y sin espacios**. Se usa para que la aplicación sepa a quién darle permisos de administrador al iniciar sesión. Por ejemplo: `admin1@example.com,admin2@example.com`. **¡IMPORTANTE! Debe coincidir exactamente con los correos que pusiste en `firestore.rules`**.
8.  **`NEXT_PUBLIC_WHATSAPP_NUMBER`**: El número de teléfono de WhatsApp (incluyendo el código de país, sin el "+") al que se enviarán los pedidos. Por ejemplo: `56912345678`.

### ¿Dónde configurarlas?

-   **Para Firebase App Hosting:** Puedes añadirlas durante el proceso de despliegue o en la configuración de tu backend de App Hosting en la consola de Firebase.
-   **Para otros servicios (Vercel, Netlify, etc.):** Ve a la configuración de tu proyecto en su respectivo dashboard y busca la sección de "Environment Variables".

Una vez que hayas configurado todo, ¡puedes desplegar tu aplicación con seguridad!
