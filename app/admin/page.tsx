"use client";

import App from "@/App";
import LenisProvider from "@/components/layout/LenisProvider";

export default function AdminPage() {
  return (
    <LenisProvider>
      <App initialView="admin" />
    </LenisProvider>
  );
}
