"use client";

import App from "@/App";
import LenisProvider from "@/components/layout/LenisProvider";

export default function Home() {
  return (
    <LenisProvider>
      <App />
    </LenisProvider>
  );
}
