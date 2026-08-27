import { LoginFlow } from "@/components/app/login-flow";
import { SiteBackdrop } from "@/components/site/background-video";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in | Crashh" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const email = typeof params?.email === "string" ? params.email : "";
  const error = typeof params?.error === "string" ? params.error : "";
  return (
    <main className="paper-grain min-h-screen">
      <SiteBackdrop />
      <LoginFlow initialEmail={email} initialError={error} />
    </main>
  );
}
