import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - DataBridge",
  description: "Sign in to your DataBridge account",
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">DataBridge</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Visual Data Migration & Mapping
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

