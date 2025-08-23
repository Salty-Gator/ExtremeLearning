"use client";

import { motion } from "framer-motion";

export default function FabricConnectPage() {
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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
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
    </section>
  );
}
