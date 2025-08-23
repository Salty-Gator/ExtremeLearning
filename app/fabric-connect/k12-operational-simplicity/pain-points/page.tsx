"use client";

import { motion } from "framer-motion";

export default function K12PainPointsPage() {
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
            K‑12 Network Deep Dive & Pain Points
          </h1>
          <p className="mt-4 text-base sm:text-lg text-default-600">
            Typical school system architecture and the operational challenges IT teams face day‑to‑day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mt-8 grid grid-cols-1 gap-4"
        >
          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">Typical school system architecture</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
              <li>District data center/core with redundant firewalls, content filter, and Internet.</li>
              <li>WAN links to each school; school distribution/core uplinks to access closets.</li>
              <li>Access layer PoE switches powering APs, ClearTouch/AV, phones, cameras, and printers.</li>
              <li>Wireless SSIDs for Students, Staff, Guests, and Devices/IoT with appropriate auth.</li>
              <li>Core services: DHCP/DNS, RADIUS/IdP, NAC/onboarding, logging, NTP, and monitoring.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">Common operational pain points</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
              <li>Onboarding complexity for diverse devices (student/faculty laptops, AV/IoT, guests).</li>
              <li>Bonjour/mDNS and casting across segments for projectors and ClearTouch screens.</li>
              <li>VLAN/ACL sprawl, inconsistent policy between schools, and change‑risk during school hours.</li>
              <li>PoE budgeting, AP density planning, and RF troubleshooting in crowded classrooms.</li>
              <li>Printer access control and discovery without exposing devices broadly.</li>
              <li>Limited IT staff: slow troubleshooting across multiple teams and tools.</li>
              <li>Seasonal surges (testing windows) that require predictability and fast rollback.</li>
              <li>Inter‑site service extension (e.g., district apps) with convoluted L3 policies.</li>
              <li>Guest isolation and BYOD governance without creating parallel infrastructures.</li>
              <li>Coordinating firmware changes, maintenance windows, and vendor interoperability.</li>
            </ul>
          </div>

          <div className="rounded-large border border-default-200 bg-content1 p-4">
            <h2 className="text-lg font-semibold text-purple-500">How Extreme Fabric Connect helps</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-2">
              <li>Service‑based networking: define services once; deploy consistently district‑wide.</li>
              <li>End‑to‑end segmentation: isolate Students, Staff, Guests, and IoT without complex ACL webs.</li>
              <li>Deterministic paths and fast convergence: minimize downtime and simplify root cause analysis.</li>
              <li>Scoped service gateways: enable AirPlay/Chromecast and printing across segments securely.</li>
              <li>Operational simplicity: fewer constructs to manage, safer changes, faster rollouts.</li>
              <li>Scales from single school to district with consistent policy and reduced toil.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


