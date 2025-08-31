import Image from 'next/image';
import type { Omit } from 'react';

// Define the props for our Logo component.
// It will take any prop that a Next.js Image component can take,
// except for `src` and `alt`, which we will define internally.
// We also make width and height optional with default values.
type LogoProps = Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> & {
  width?: number;
  height?: number;
};

// The Icons object now exports a Logo component that renders the brand logo.
export const Icons = {
  Logo: ({ width = 32, height = 32, ...props }: LogoProps) => (
    <Image 
      src="/logo.png" 
      alt="Jardín y Huerta Labranza Logo" 
      width={width} 
      height={height} 
      {...props} 
    />
  ),
};
