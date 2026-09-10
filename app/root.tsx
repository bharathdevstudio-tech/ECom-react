import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/root";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import stylesheet from "./globals.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", href: "/favicon.ico" },
];

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Nova Store — Premium Gadgets & Accessories" },
    { name: "description", content: "Nova Store — premium gadgets and accessories for the modern lifestyle." },
  ];
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const isErrorResponse = isRouteErrorResponse(error);
  const message = isErrorResponse ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("ErrorBoundary caught:", error);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error — Nova Store</title>
        <Links />
      </head>
      <body className="flex min-h-full flex-col bg-[#fafafa] font-sans dark:bg-zinc-950">
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Something went wrong</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
            {stack && (
              <pre className="text-left text-sm bg-zinc-100 dark:bg-zinc-900 p-4 rounded overflow-auto text-zinc-700 dark:text-zinc-300 max-h-96">
                {stack}
              </pre>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}

export function ServerErrorBoundary({ error }: { error: unknown }) {
  const isErrorResponse = isRouteErrorResponse(error);
  const message = isErrorResponse ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("ServerErrorBoundary caught:", error);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Server Error — Nova Store</title>
        <Links />
      </head>
      <body className="flex min-h-full flex-col bg-[#fafafa] font-sans dark:bg-zinc-950">
        <main className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">Server Error</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
            {stack && (
              <pre className="text-left text-sm bg-zinc-100 dark:bg-zinc-900 p-4 rounded overflow-auto text-zinc-700 dark:text-zinc-300 max-h-96">
                {stack}
              </pre>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-full flex-col bg-[#fafafa] font-sans dark:bg-zinc-950">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <Header />
            <main className="flex flex-1 flex-col">
              <Outlet />
            </main>
            <Footer />
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
