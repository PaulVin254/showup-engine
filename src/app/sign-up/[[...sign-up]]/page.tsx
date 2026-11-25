import Link from "next/link";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { BrandWordmark } from "@/components/BrandMark";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] flex flex-col">
      <header className="h-14 px-5 flex items-center justify-between border-b border-neutral-200 bg-white">
        <Link href="/" aria-label="ShowUp home">
          <BrandWordmark />
        </Link>
        <Link
          href="/"
          className="text-[12.5px] font-medium text-neutral-500 hover:text-[#111111] transition-colors"
        >
          ← Back to home
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense>
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#111111",
                borderRadius: "12px",
              },
            }}
          />
        </Suspense>
      </main>
    </div>
  );
}
