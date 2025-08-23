"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function K12OperationalSimplicityPage() {
  const router = useRouter();
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-purple-500">Fabric Connect</span> for <span className="text-purple-500">K‑12</span>: Operational Simplicity
          </h1>
          <p className="mt-4 text-base sm:text-lg text-default-600">
            How Extreme Fabric Connect simplifies operations for lean K‑12 IT teams.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mt-8 grid grid-cols-1 gap-4"
        >
          <div
            className="group rounded-large border border-default-200 bg-content1 p-4 cursor-pointer transition-all duration-200 ease-out hover:bg-content2/60 hover:border-default-300 hover:shadow-medium hover:-translate-y-0.5"
            role="link"
            tabIndex={0}
            onClick={() => router.push("/fabric-connect/k12-operational-simplicity/pain-points")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/fabric-connect/k12-operational-simplicity/pain-points");
              }
            }}
          >
            <h2 className="text-lg font-semibold text-purple-500 group-hover:text-purple-600">Typical K‑12 network infrastructure</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
              <li>Core/data center switches.</li>
              <li>Distribution switches at schools/campuses.</li>
              <li>Access switches (PoE) for edge connectivity.</li>
              <li>Wireless access points (managed, PoE).</li>
              <li>Routers (WAN/edge) for site and Internet connectivity.</li>
              <li>Firewalls for perimeter and security enforcement.</li>
              <li>Internet circuits and WAN links between district and schools.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">Consistent policy from core to classroom</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
              <li>End‑to‑end segmentation for student, staff, guest, and IoT services.</li>
              <li>Uniform constructs simplify Day‑2 operations and audits.</li>
              <li>Role‑based access aligns with district security posture.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">Troubleshoot faster</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
              <li>Clear service boundaries reduce blast radius and isolate faults.</li>
              <li>Deterministic paths and rapid convergence minimize downtime.</li>
              <li>Simplified constructs shorten mean time to innocence.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">Why it matters for K‑12</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
              <li>Lean IT teams can operate district‑wide networks with confidence.</li>
              <li>Predictable changes support testing windows and instructional time.</li>
              <li>Scales from a single campus to multi‑site districts seamlessly.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">What to explore next</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
              <li>Fabric Connect overview and deployment patterns.</li>
              <li>E‑Rate Category 2 planning for eligible internal connections.</li>
              <li>Secure segmentation for student, staff, and IoT networks.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


