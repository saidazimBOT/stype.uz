"use client";

import App from "@/App";
import LenisProvider from "@/components/layout/LenisProvider";

export default function AdminLoginPage() {
  return (
    <LenisProvider>
      <App initialView="admin" />
    </LenisProvider>
  );
}
