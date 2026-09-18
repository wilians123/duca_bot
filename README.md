This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Autenticación y roles

La aplicación usa Firebase Auth (correo y contraseña) y Firestore. Habilita el proveedor **Email/Password** en Firebase Authentication, crea la base de datos Firestore y publica [firestore.rules](./firestore.rules).

1. Copia las variables públicas de `.env.example` a `.env` y completa los valores del proyecto Firebase.
2. Ejecuta `npm run seed:firebase` una vez para crear `will_admin@ducabot.com` y `will_user@ducabot.com`, ambos con contraseña `123456`.
3. Abre `/login`. El administrador entra a `/dashboard` y puede navegar a `/usuarios` y `/reportes`; el operador entra al flujo original de extracción desde `/dashboard`.

La sesión se cierra automáticamente después del periodo definido en `NEXT_PUBLIC_SESSION_INACTIVITY_MINUTES` (30 minutos por defecto). La consola de logs se controla con `NEXT_PUBLIC_DEV_LOGS=true`.

El script de seed conserva perfiles existentes y nunca elimina documentos. La desactivación de usuarios desde el panel solo cambia `active` a `false`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
