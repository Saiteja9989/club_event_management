import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  Info,
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const success = await register({
      name: formData.name,
      email: formData.email,
      rollNumber: formData.rollNumber,
      password: formData.password,
    });

    if (success) navigate("/");
    else setError("Registration failed. Email may already exist.");

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white text-2xl font-bold">
            ClubHub
          </div>

          <div className="mt-20 max-w-md">
            <h2 className="text-4xl font-black leading-tight mb-6">
              Empowering Campus Life
            </h2>

            <p className="text-white/80 text-lg mb-10">
              Join the central hub for student organizations. Simplify your
              college journey by connecting with the right people and events.
            </p>

            <ul className="space-y-6">
              <Benefit
                icon={<Users />}
                title="Join Clubs"
                desc="Connect with organizations that match your interests."
              />
              <Benefit
                icon={<CalendarCheck />}
                title="Discover Events"
                desc="Stay updated with seminars, workshops, and fests."
              />
              <Benefit
                icon={<ShieldCheck />}
                title="Track Attendance"
                desc="Build an official record of extracurricular activities."
              />
            </ul>
          </div>
        </div>

        <p className="relative z-10 text-white/50 text-sm">
          © 2026 ClubHub Management System
        </p>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-background">
        <div className="max-w-[480px] w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-primary text-xl font-bold mb-10">
            ClubHub
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h2>
            <p className="text-muted-foreground">
              Join your campus community today and start exploring.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />

            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="student@college.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />

            <Field
              label="Roll Number / Student ID"
              name="rollNumber"
              placeholder="e.g. 2021-CS-123"
              value={formData.rollNumber}
              onChange={handleChange}
              disabled={isLoading}
            />

            <Field
              label="Password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />

            <Field
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-10 bg-primary/5 rounded-lg p-4 flex gap-3">
            <Info className="text-primary w-5 h-5 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By registering, you agree to our Terms of Service and Privacy Policy
              for campus organizations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER COMPONENTS ================= */

function Field({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        {...props}
        className="w-full h-12 rounded-lg border border-border bg-white dark:bg-gray-900 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function Benefit({ icon, title, desc }) {
  return (
    <li className="flex gap-4">
      <div className="bg-white/20 p-2 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-white/70 text-sm">{desc}</p>
      </div>
    </li>
  );
}
