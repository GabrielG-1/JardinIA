export function LocationSection() {
  const address = "1 norte #10, Labranza, Chile";
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(address)}`;

  return (
    <section id="ubicacion" className="w-full">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-headline">Ubicación</h2>
        <p className="text-muted-foreground mt-2">Encuéntranos en el corazón de Labranza.</p>
      </div>
      <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-sm">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
        ></iframe>
      </div>
    </section>
  );
}
