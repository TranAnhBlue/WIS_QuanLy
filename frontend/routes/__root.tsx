import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../style.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../contexts/AuthContext";

import { FileQuestion, Home, ArrowLeft } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6">
            <FileQuestion className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>

          {/* Error Code */}
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-500 mb-2">
            404
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">
            Không tìm thấy trang
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="javascript:history.back()"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>

          {/* Popular Pages */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Các trang phổ biến:</strong>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/"
                className="text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/attendance"
                className="text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                Chấm công
              </Link>
              <Link
                to="/profile"
                className="text-xs px-3 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                Hồ sơ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Unity Hub is a comprehensive enterprise platform for managing business operations, customer relations, and internal collaboration." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Unity Hub is a comprehensive enterprise platform for managing business operations, customer relations, and internal collaboration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Unity Hub is a comprehensive enterprise platform for managing business operations, customer relations, and internal collaboration." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/654b352c-ed5c-4188-b1f1-7c6219ee3680/id-preview-606ee506--cee1204b-814c-4f6a-aa3e-bd6bd3398d55.lovable.app-1782788379935.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/654b352c-ed5c-4188-b1f1-7c6219ee3680/id-preview-606ee506--cee1204b-814c-4f6a-aa3e-bd6bd3398d55.lovable.app-1782788379935.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
