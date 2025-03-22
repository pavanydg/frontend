'use client';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleSignupClick = () => {
    router.push("/signup");
  };

  const handleSigninClick = () => {
    router.push("/signin");
  };

  return (
    <nav className="w-full max-w-7xl flex justify-between items-center py-6 mx-auto">
      <div className="text-2xl font-bold flex items-center gap-1">
        Voice<span className="text-indigo-400">Genie</span>
      </div>
      <ul className="flex gap-6">
        {["Home", "Features", "About", "Review", "Blog"].map((item) => (
          <li key={item} className="cursor-pointer hover:text-indigo-300">
            {item}
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <Button variant="outline" className="border-white text-white" onClick={handleSigninClick}>
          Sign In
        </Button>
        <Button onClick={handleSignupClick}>Sign up for free</Button>
      </div>
    </nav>
  );
}
