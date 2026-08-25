import { LoginFlow } from "@/components/app/login-flow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in | Brewed" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const email = typeof params?.email === "string" ? params.email : "";
  const error = typeof params?.error === "string" ? params.error : "";
  return (
    <main className="paper-grain min-h-screen">
      <LoginFlow initialEmail={email} initialError={error} />
    </main>
  );
}
