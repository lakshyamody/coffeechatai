import { LoginFlow } from "@/components/app/login-flow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in | Brewed" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const raw = params?.email;
  return (
    <main className="paper-grain min-h-screen">
      <LoginFlow initialEmail={typeof raw === "string" ? raw : ""} />
    </main>
  );
}
