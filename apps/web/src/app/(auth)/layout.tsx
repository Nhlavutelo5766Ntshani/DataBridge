import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - DataBridge",
  description: "Sign in to your DataBridge account",
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default AuthLayout;

