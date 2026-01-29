import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/useToast";
import { Users, CalendarCheck, School, Eye, EyeOff } from "lucide-react";


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    setIsLoading(false);

    if (success) {
      toast({
        title: "Login successful 🎉",
        description: "Welcome back! Redirecting to dashboard…",
      });
      setTimeout(() => navigate("/"), 1000);
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ================= LEFT PANEL ================= */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-center overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-white text-primary">
              <School />
            </div>
            <h1 className="text-4xl font-bold text-white">ClubHub</h1>
          </div>

          <h2 className="text-xl font-semibold text-white/90 mb-4">
            The heart of your campus community.
          </h2>

          <p className="text-lg text-white/80 leading-relaxed mb-10">
            Empowering college communities through seamless organization and
            student engagement. Connect, manage, and stay updated.
          </p>

          <div className="flex flex-wrap gap-4">
            <Badge icon={<Users />} text="500+ Active Clubs" />
            <Badge icon={<CalendarCheck />} text="Daily Events" />
          </div>
        </div>

        <p className="absolute bottom-10 left-12 text-xs text-white/50">
          © 2024 ClubHub Academic Project
        </p>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-white dark:bg-background">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 text-primary">
            <School />
            <span className="text-2xl font-bold">ClubHub</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground">
              Login to your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <Field
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<span>@</span>}
              disabled={isLoading}
            />

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full h-12 rounded-lg border border-border px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white dark:bg-gray-900"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Remember me for 30 days
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition focus:ring-2 focus:ring-primary"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function Field({ label, icon, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          {...props}
          className="w-full h-12 rounded-lg border border-border bg-white dark:bg-gray-900 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}

function Badge({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
      {icon}
      <span>{text}</span>
    </div>
  );
}
