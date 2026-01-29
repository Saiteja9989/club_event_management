import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import adminApi from "../../api/adminApi";
import {
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await adminApi.getDashboardStats();
      setData(res.data.stats);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading dashboard…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium mb-4">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-10 p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              System Overview •{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-sm font-semibold hover:bg-muted transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Students"
            value={data.totalStudents}
            icon={<Users />}
            trend="+5.2%"
          />
          <StatCard
            title="Active Clubs"
            value={data.activeClubs}
            icon={<Users />}
            trend="-2"
            danger
          />
          <StatCard
            title="Total Events"
            value={data.totalEvents}
            icon={<Calendar />}
            trend="+12%"
          />
          <StatCard
            title="Pending Approvals"
            value={data.pendingEvents}
            icon={<Clock />}
            urgent
          />
          <StatCard
            title="Registrations"
            value={data.totalRegistrations}
            icon={<TrendingUp />}
            trend="+8%"
          />
          <StatCard
            title="Avg Attendance"
            value={`${data.avgAttendance}%`}
            icon={<CheckCircle />}
            trend="+3%"
          />
        </div>

        {/* Urgent Actions */}
        <section>
          <SectionTitle title="Urgent Actions" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActionCard
              title="Pending Event Reviews"
              description={`${data.pendingEvents} events waiting for admin approval`}
              link="/admin/events"
              linkText="Review Now"
              highlight="amber"
            />

            <ActionCard
              title="Inactive Clubs"
              description={`${data.inactiveClubs || 0} clubs haven’t reported activity`}
              link="/admin/clubs"
              linkText="View Clubs"
              highlight="rose"
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <SectionTitle title="Recent Activity" />
          </div>

          <div className="bg-white rounded-2xl border p-6 space-y-6">
            {recentActivity.length ? (
              recentActivity.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start border-b last:border-0 pb-4"
                >
                  <div>
                    <p className="font-semibold">{item.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No recent activity
              </p>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Components ---------- */

function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function StatCard({ title, value, icon, trend, urgent, danger }) {
  return (
    <div
      className={`rounded-2xl border p-6 bg-white transition hover:shadow-md ${
        urgent ? "border-amber-200 bg-amber-50/40" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-lg ${
              danger
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <h3 className="text-3xl font-black mt-1">{value}</h3>
    </div>
  );
}

function ActionCard({ title, description, link, linkText, highlight }) {
  const colors = {
    amber: "border-amber-200 bg-amber-50/40",
    rose: "border-rose-200 bg-rose-50/40",
  };

  return (
    <div
      className={`rounded-2xl border p-6 flex justify-between items-center ${colors[highlight]}`}
    >
      <div>
        <h4 className="font-black">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Link
        to={link}
        className="flex items-center gap-1 text-primary font-bold hover:translate-x-1 transition"
      >
        {linkText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
