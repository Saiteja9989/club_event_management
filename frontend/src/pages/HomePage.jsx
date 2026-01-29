import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  Users,
  BarChart3,
  GraduationCap,
  ShieldCheck,
  UserCog,
} from "lucide-react";

/* ---------------- NAV ITEMS ---------------- */
const navItems = [
  { label: "Home", id: "home" },
  { label: "Features", id: "features" },
  { label: "Roles", id: "roles" },
  { label: "Footer", id: "footer" },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  /* -------- ROLE BASED REDIRECT -------- */
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "leader") navigate("/leader/dashboard");
      else if (user.role === "student") navigate("/student/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  /* -------- SMOOTH SCROLL -------- */
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-primary">ClubHub</div>

          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
                <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
            ))}
          </nav>

          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="border-b border-border bg-muted/40"
      >
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-[40%_60%] gap-10 items-center">

          {/* LEFT CONTENT */}
          <div className="space-y-6">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {/* Academic Project Presentation */}
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Club and Event Management System
            </h1>

           <p className="text-muted-foreground max-w-lg">
              A centralized platform designed to streamline student organization
              workflows, event scheduling, and membership tracking for academic
              institutions.
            </p>

            <div className="flex gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
              >
                Explore System
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-lg border border-border font-semibold"
              >
                Read Docs
              </Link>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative flex justify-end">
  {/* background frame */}
  <div className="absolute -z-10 right-0 w-[520px] h-[360px] lg:w-[640px] lg:h-[420px] rounded-[40px] bg-primary/10 blur-2xl"></div>

  <img
    src="/src/assets/hero-illustration.png"
    alt="Event management illustration"
    className="w-full max-w-[720px] lg:max-w-[860px] drop-shadow-2xl"
  />
</div>

        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <h2 className="text-2xl font-bold mb-2">System Core Features</h2>
        <div className="h-1 w-20 bg-primary mb-10"></div>

        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon={<CalendarDays />}
            title="Event Scheduling"
            desc="Coordinate and schedule campus events with a centralized calendar system ensuring no overlaps."
          />
          <Feature
            icon={<Users />}
            title="Membership Management"
            desc="Maintain accurate member lists, track engagement, and manage communications."
          />
          <Feature
            icon={<BarChart3 />}
            title="Report Generation"
            desc="Generate detailed reports for attendance, activity, and administrative review."
          />
        </div>
      </section>

      {/* ================= ROLES ================= */}
      <section
        id="roles"
        className="border-t border-border bg-muted/30 py-20"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center">
            User Roles & Responsibilities
          </h2>
          <p className="text-muted-foreground text-center mt-2 mb-12">
            Defined access control levels within the ClubHub environment
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Role
              icon={<GraduationCap />}
              title="Student"
              items={[
                "Browse verified campus clubs",
                "Register for events and workshops",
                "Apply for club membership",
              ]}
            />
            <Role
              icon={<UserCog />}
              title="Club Lead"
              items={[
                "Create and manage events",
                "Approve member requests",
                "Update club profiles",
              ]}
            />
            <Role
              icon={<ShieldCheck />}
              title="Administrator"
              items={[
                "System-wide oversight",
                "Manage club approvals",
                "Audit reports and logs",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer
        id="footer"
        className="border-t border-border py-10 text-sm"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground">
            Developed by Project Team 09 | Academic Year 2025–2026
          </p>
          <div className="flex gap-6 text-muted-foreground">
            <a className="hover:text-primary">Terms</a>
            <a className="hover:text-primary">Privacy</a>
            <a className="hover:text-primary">System Status</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Feature({ icon, title, desc }) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Role({ icon, title, items }) {
  return (
    <div className="border border-border rounded-xl bg-card">
      <div className="p-5 border-b border-border flex items-center gap-2 text-primary font-bold">
        {icon}
        {title}
      </div>
      <ul className="p-6 space-y-3 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
