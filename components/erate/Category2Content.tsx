"use client";

import React from "react";

export default function Category2Content() {
  return (
    <div>
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
  );
}
