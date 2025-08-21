# **App Name**: JardínIA

## Core Features:

- Header: Display a fixed header with logo, name, and navigation links: 'Catálogo', 'Asesor IA', 'Comunidad', and 'Contacto'.
- Hero Section: Implement a Hero section with a background image, semi-transparent overlay, title, descriptive subtitle, and a search bar.
- Product Catalog: Create a catalog section displaying product categories (Agroquímicos, Fertilizantes, Semillas, Nutrición Animal) in an interactive accordion with product cards.
- AI Crop Advisor: Enable users to upload a plant photo and description; use Genkit (Gemini model) to analyze and provide a diagnosis with plant name, health status, and recommendations. Tool functionality included.
- Community Tips: Develop a community tips section dynamically displaying user-submitted tips from Firebase Firestore. Implement a form for adding new tips.
- Contact Form: Include a basic contact form for user inquiries.
- Footer: Implement a footer displaying the company name, current year, and social media links.

## Style Guidelines:

- Primary color: Olive green (#6B8E23), reflecting the agricultural theme, set as HSL variable.
- Accent color: Terracotta/orange (#E07A5F) for highlights and calls to action, set as HSL variable.
- Background color: Very light green (#F5FADF), desaturated from the primary, to provide a subtle, fresh backdrop.
- Headline and body font: 'Alegreya', a serif font providing an elegant, intellectual, contemporary feel. Note: currently only Google Fonts are supported.
- Use relevant icons for product categories and UI elements, sourced from lucide-react.
- Employ a single-page layout with smooth scrolling for navigation between sections.
- Incorporate subtle transitions and loading animations, particularly during AI processing.