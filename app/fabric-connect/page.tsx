"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function FabricConnectPage() {
  const tabLabels = [
    "Overview",
    "How To's",
    "Best Practices",
    "Troubleshooting",
    "Resources",
    "Videos",
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabLabels)[number]>("Overview");
  const toId = (label: string) => `tab-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
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
            <span className="text-purple-500">Extreme Networks</span> Fabric Connect
          </h1>
          <p className="mt-4 text-base sm:text-lg text-default-600">
            Learn core concepts, benefits, and deployment patterns for Fabric Connect.
          </p>
        </motion.div>

        {/* Tabs header */}
        <div className="mt-8">
          <nav
            role="tablist"
            aria-label="Fabric Connect sections"
            className="flex flex-wrap gap-2 border-b border-default-200 pb-2"
          >
            {tabLabels.map((label) => {
              const id = toId(label);
              const isActive = activeTab === label;
              return (
                <button
                  key={label}
                  id={`${id}-tab`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${id}-panel`}
                  onClick={() => setActiveTab(label)}
                  className={`px-3 py-2 text-sm rounded-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    isActive
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-default-700 hover:text-default-900 hover:bg-default-100"
                  }`}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tabs content */}
        {activeTab === "Overview" && (
          <div
            id={`${toId("Overview")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("Overview")}-tab`}
            className="mt-8"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500">Fabric Connect: A Smarter Way to Build the Network</h2>
              <p className="mt-2 text-default-700">
                Extreme Networks Fabric Connect is a modern, service-based networking solution that simplifies operations,
                strengthens security, and accelerates digital transformation. By eliminating legacy complexity and delivering a
                highly agile, resilient foundation, Fabric Connect enables organizations to innovate faster, reduce operational
                risk, and align IT infrastructure directly with business priorities.
              </p>
            </div>

            <div className="mt-6 rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500" id="why">Why Fabric Connect?</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-base font-semibold text-purple-700">Technical Advantages</h3>
                  <ul className="mt-2 list-disc pl-5 text-default-700 space-y-2">
                    <li><strong className="text-purple-700">Eliminates Complexity:</strong> Replaces spanning tree and multiple legacy routing protocols with a simplified, deterministic fabric architecture.</li>
                    <li><strong className="text-purple-700">Service Virtualization:</strong> Uses I-SIDs to deliver Layer 2, Layer 3, and multicast services as secure, isolated segments across the entire network.</li>
                    <li><strong className="text-purple-700">Faster Moves, Adds, and Changes:</strong> Provision services once at the edge and extend anywhere in the fabric—no core reconfiguration required.</li>
                    <li><strong className="text-purple-700">Built-in Resiliency:</strong> Equal-cost multipath forwarding and rapid convergence ensure application uptime during failures or planned changes.</li>
                    <li><strong className="text-purple-700">Simplified Multicast:</strong> Control-plane based multicast avoids fragile PIM trees and dramatically reduces operational overhead.</li>
                    <li><strong className="text-purple-700">Consistent Operations:</strong> Deterministic paths make troubleshooting more predictable and automation more effective.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-purple-700">Business Benefits</h3>
                  <ul className="mt-2 list-disc pl-5 text-default-700 space-y-2">
                    <li><strong className="text-purple-700">Accelerated Service Delivery:</strong> Bring new applications, campuses, or acquired sites online quickly without disruptive projects.</li>
                    <li><strong className="text-purple-700">Reduced Operational Costs:</strong> Lower reliance on specialized engineers and fewer professional services hours for configuration or troubleshooting.</li>
                    <li><strong className="text-purple-700">Enhanced Security &amp; Compliance:</strong> Built-in macro- and micro-segmentation aligns with zero-trust strategies and regulatory requirements.</li>
                    <li><strong className="text-purple-700">Risk Reduction:</strong> Isolate sensitive data and critical applications to minimize attack surface while improving resilience.</li>
                    <li><strong className="text-purple-700">Staff Efficiency:</strong> Simplified workflows allow junior engineers to handle provisioning, reducing dependency on “hero engineers.”</li>
                    <li><strong className="text-purple-700">Predictable Transformation:</strong> Phased adoption integrates with existing OSPF/BGP environments, lowering migration risk.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500" id="strategic">Strategic Impact</h2>
              <ul className="mt-2 list-disc pl-5 text-default-700 space-y-2">
                <li><strong className="text-purple-700">Future-Ready Platform:</strong> Supports identity-driven access, zero-trust networking, and IoT/OT onboarding at scale.</li>
                <li><strong className="text-purple-700">Supports Digital Transformation:</strong> Provides a secure, agile foundation to drive modernization, cloud adoption, and smart campus or enterprise initiatives.</li>
                <li><strong className="text-purple-700">Business Alignment:</strong> Ensures the network evolves at the pace of the organization—enabling innovation without compromising security or stability.</li>
              </ul>
              <p className="mt-3 text-default-600">
                Designed for CIOs and CTOs who need operational simplicity, scalable security, and measurable outcomes.
              </p>
            </div>
          </div>
        )}

        {/* Removed Why tab per request */}

        {activeTab === "How To's" && (
          <div
            id={`${toId("How To's")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("How To's")}-tab`}
            className="mt-8"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500">How To's</h2>
              <p className="mt-2 text-default-700">Guided tasks, configuration steps, and examples.</p>
            </div>
          </div>
        )}

        {activeTab === "Best Practices" && (
          <div
            id={`${toId("Best Practices")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("Best Practices")}-tab`}
            className="mt-8"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500">Best Practices</h2>
              <p className="mt-2 text-default-700">Design guidelines and operational recommendations.</p>
            </div>
          </div>
        )}

        {activeTab === "Troubleshooting" && (
          <div
            id={`${toId("Troubleshooting")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("Troubleshooting")}-tab`}
            className="mt-8"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500">Troubleshooting</h2>
              <p className="mt-2 text-default-700">Common issues, diagnostics, and fixes.</p>
              <div className="mt-4 rounded-medium border border-default-200 bg-default-50 p-3" role="note" aria-label="Troubleshooting disclaimer">
                <p className="text-sm text-default-700">
                  Disclaimer: It is best to always keep your hardware and software maintenance up to date, never purchase
                  gray market equipment, and always use Extreme Networks GTAC for support-related needs. This website is not
                  meant to supplement GTAC.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Resources" && (
          <div
            id={`${toId("Resources")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("Resources")}-tab`}
            className="mt-8"
          >
            <div className="rounded-large border border-default-200 bg-content1 p-4">
              <h2 className="text-lg font-semibold text-purple-500">Resources</h2>
              <p className="mt-2 text-default-700">Links to docs, whitepapers, and tools.</p>
            </div>
          </div>
        )}

        {activeTab === "Videos" && (
          <div
            id={`${toId("Videos")}-panel`}
            role="tabpanel"
            aria-labelledby={`${toId("Videos")}-tab`}
            className="mt-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="mt-0"
            >
              <div className="rounded-large border border-default-200 bg-content1 p-4">
                <h2 className="text-lg font-semibold text-purple-500">Fear Not the Fabric</h2>
                <div className="mt-4" style={{ position: "relative", overflow: "hidden", aspectRatio: "1920/1080" }}>
                  <iframe
                    src="https://share.synthesia.io/embeds/videos/462a269c-1750-4cb2-8761-cd38ff7c81c2"
                    loading="lazy"
                    title="Synthesia video player - Fabric Connect L2 VSN"
                    allowFullScreen
                    allow="encrypted-media; fullscreen;"
                    style={{ width: "100%", height: "100%", top: 0, left: 0, border: "none", padding: 0, margin: 0, overflow: "hidden" }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="mt-8"
            >
              <div className="rounded-large border border-default-200 bg-content1 p-4">
                <h2 className="text-lg font-semibold text-purple-500">Overview Video</h2>
                <div className="mt-4" style={{ position: "relative", overflow: "hidden", aspectRatio: "1920/1080" }}>
                  <iframe
                    src="https://share.synthesia.io/embeds/videos/1e5caba4-0ada-4f22-ac71-5efe47f3230c"
                    loading="lazy"
                    title="Synthesia video player - Unlocking Network Simplicity: From Cisco to Fabric Connect"
                    allowFullScreen
                    allow="encrypted-media; fullscreen;"
                    style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, border: "none", padding: 0, margin: 0, overflow: "hidden" }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
