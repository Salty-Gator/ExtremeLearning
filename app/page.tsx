 
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const [isC2Open, setIsC2Open] = useState(false);
  return (
    <>
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-2 sm:px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-purple-500">Extreme Networks</span> Learning Hub
            </h1>
            <p className="mt-4 text-base sm:text-lg text-default-600">
              A community-built space for network infrastructure engineers and architects to explore
              Extreme Networks, Fabric Connect, and related technologies.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="mt-8 sm:mt-10"
          >
            <div className="rounded-large bg-content2/60 px-4 sm:px-6 py-4 border border-default-200">
              <h2 className="text-lg font-semibold text-purple-500">Disclaimer</h2>
              <p className="mt-2 text-sm sm:text-base text-default-600">
                This web application is not sponsored by or affiliated with Extreme Networks. It is
                created by and for passionate professionals who want to deepen their understanding of
                Extreme Networks solutions.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h3 className="font-semibold text-purple-500">What you’ll learn</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                <li>Extreme Networks platform fundamentals</li>
                <li>Designing robust enterprise network architectures</li>
                <li>Operational best practices and troubleshooting</li>
              </ul>
            </div>
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h3 className="font-semibold text-purple-500">Fabric Connect</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                <li>Core concepts and benefits</li>
                <li>Configuration patterns and deployment tips</li>
                <li>Integration in modern infrastructures</li>
              </ul>
            </div>
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h3 className="font-semibold text-purple-500">How to use this app</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                <li>Ask questions in the Chat to explore topics</li>
                <li>Save sessions to revisit your research</li>
                <li>Switch themes anytime (top-right)</li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
            className="mt-12"
          >
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="text-purple-500">K-12</span> School Systems
              </h2>
              <p className="mt-3 text-sm sm:text-base text-default-600">
                Benefits of running Extreme Networks Fabric Connect across districts and campuses.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-default-200 bg-content1 p-4"
              >
                <h3 className="font-semibold text-purple-500">Secure segmentation & resiliency</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                  <li>End-to-end segmentation for students, staff, and IoT devices</li>
                  <li>Fast convergence and deterministic paths to minimize disruptions</li>
                  <li>Reduce lateral movement and blast radius of incidents</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.06, duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-default-200 bg-content1 p-4"
              >
                <h3 className="font-semibold text-purple-500">Operational simplicity</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                  <li>Simplified adds/moves/changes with service-based networking</li>
                  <li>Consistent policy from the core to the classroom edge</li>
                  <li>Reduced troubleshooting time for lean IT teams</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: 0.12, duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-default-200 bg-content1 p-4"
              >
                <h3 className="font-semibold text-purple-500">Leverage E-Rate (USAC Category 2)</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                  <li>Fund eligible internal connections and basic maintenance</li>
                  <li>Align projects to district five-year Category 2 budgets</li>
                  <li>Plan around Forms 470/471 timelines and documentation</li>
                  <li>Confirm eligibility with your E-Rate consultant and USAC resources</li>
                </ul>
                <p className="mt-3 text-xs text-default-500">
                  Note: Informational only; verify program details and eligibility with USAC.
                </p>
                <button
                  type="button"
                  onClick={() => setIsC2Open(true)}
                  className="mt-3 text-sm font-semibold text-purple-500 hover:text-purple-600 underline"
                >
                  Click here for Category 2 details
                </button>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>
      <AnimatePresence>
        {isC2Open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsC2Open(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="c2-modal-title"
              className="mx-auto mt-16 w-[92%] max-w-5xl rounded-large border border-default-200 bg-content1 shadow-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 id="c2-modal-title" className="text-xl sm:text-2xl font-bold tracking-tight">
                      <span className="text-purple-500">Category 2</span> E-Rate Funding Guide
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-default-600">
                      Understand IC, BMIC, and MIBS, and how to plan projects that align with USAC rules.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsC2Open(false)}
                    aria-label="Close"
                    className="rounded-medium border border-default-200 px-3 py-1.5 text-sm text-default-600 hover:bg-content2"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="rounded-large border-t-4 border-purple-500 border border-default-200 bg-content1 p-4">
                    <h4 className="font-semibold text-default-800">IC (Internal Connections)</h4>
                    <p className="mt-2 text-sm text-default-600">Hardware and required licenses to run your network.</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                      <li>Access points, switches, routers, cabling</li>
                      <li>Right-to-use subscriptions</li>
                      <li>Bundled essential support (when inseparable)</li>
                    </ul>
                  </div>
                  <div className="rounded-large border-t-4 border-green-500 border border-default-200 bg-content1 p-4">
                    <h4 className="font-semibold text-default-800">BMIC (Basic Maintenance)</h4>
                    <p className="mt-2 text-sm text-default-600">Support and upkeep for equipment you already own.</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                      <li>Break/fix repairs</li>
                      <li>Firmware updates</li>
                      <li>Support-only contracts</li>
                    </ul>
                  </div>
                  <div className="rounded-large border-t-4 border-purple-400 border border-default-200 bg-content1 p-4">
                    <h4 className="font-semibold text-default-800">MIBS (Managed Services)</h4>
                    <p className="mt-2 text-sm text-default-600">Vendor-managed operations and monitoring.</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-default-600 space-y-1">
                      <li>Managed Wi‑Fi</li>
                      <li>Network monitoring</li>
                      <li>Performance tuning</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 rounded-large border border-default-200 bg-content2/60 p-4">
                  <h4 className="font-semibold text-default-800">Multi‑Year Subscription Rule</h4>
                  <ul className="mt-2 list-disc pl-5 text-sm text-default-700 space-y-1">
                    <li><span className="font-semibold">Myth:</span> All subscriptions are limited to one year.</li>
                    <li><span className="font-semibold">Fact:</span> If a subscription is essential for the hardware to work, it is IC and can be funded for up to five years.</li>
                    <li>BMIC and MIBS subscriptions are limited to one year.</li>
                  </ul>
                </div>

                <div className="mt-6 rounded-large border border-default-200 bg-content1 p-4">
                  <h4 className="font-semibold text-default-800">Bundled Support Clarification</h4>
                  <p className="mt-2 text-sm text-default-600">
                    If an essential operating license includes technical support as a standard, non‑separable part of the subscription, the entire bundle is eligible as IC, including multi‑year renewal.
                  </p>
                </div>

                <div className="mt-6 rounded-large border border-default-200 bg-content1 p-4">
                  <h4 className="font-semibold text-default-800">Quick Category Flow</h4>
                  <ol className="mt-2 list-decimal pl-5 text-sm text-default-600 space-y-2">
                    <li>
                      Is it new hardware or a license required for hardware to function? → <span className="font-semibold">IC</span> (multi‑year allowed)
                    </li>
                    <li>
                      Is it support‑only (break/fix)? → <span className="font-semibold">BMIC</span> (1 year only)
                    </li>
                    <li>
                      Is a vendor actively managing your network? → <span className="font-semibold">MIBS</span> (1 year only)
                    </li>
                  </ol>
                </div>

                <p className="mt-6 text-xs text-default-500">
                  Always confirm eligibility and timelines (Forms 470/471) with your E‑Rate consultant and USAC resources.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
