export default function DucaTLayout({ children }: { children: React.ReactNode }) {
  // No agregamos <html>/<body> aquí: ya existen en src/app/layout.tsx raíz.
  // Este layout solo agrupa la sección /duca-t/* si en el futuro necesitas
  // providers específicos de este flujo (ej. un QueryClientProvider).
  return <>{children}</>;
}
