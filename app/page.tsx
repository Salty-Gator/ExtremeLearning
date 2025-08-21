 
"use client";

import { motion } from "framer-motion";

export default function Home() {
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
      </div>
    </section>
  );
}
