"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/react";
import { Button } from "@heroui/button";
import { getFirebaseDb } from "@/lib/firebase/client";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import AuthGate from "@/lib/authz/AuthGate";

type DailyRow = { date: string; promptTokens: number; completionTokens: number; totalTokens: number; costUSD: string };

// Match pricing used in admin page
const GPT5_MINI_INPUT_PER_1K = 0.00015;
const GPT5_MINI_OUTPUT_PER_1K = 0.0006;

function computeCostUSD(promptTokens: number, completionTokens: number): string {
  const inputCost = (promptTokens / 1000) * GPT5_MINI_INPUT_PER_1K;
  const outputCost = (completionTokens / 1000) * GPT5_MINI_OUTPUT_PER_1K;
  return `$${(inputCost + outputCost).toFixed(4)}`;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useMemo(() => getFirebaseDb(), []);
  const userId = String(params?.id || "");

  const [profile, setProfile] = useState<any | null>(null);
  const [rows, setRows] = useState<DailyRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const p = await getDoc(doc(db, "userProfiles", userId));
        setProfile(p.exists() ? p.data() : null);

        // Build last 30 days keys
        const today = new Date();
        const keys: string[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          keys.push(d.toISOString().slice(0, 10));
        }
        const result: DailyRow[] = [];
        for (const k of keys) {
          try {
            const dcol = collection(db, "usageDaily", k, "users");
            const docSnap = await getDoc(doc(dcol, userId));
            const data = docSnap.exists() ? (docSnap.data() as any) : null;
            const prompt = Number(data?.promptTokens || 0);
            const completion = Number(data?.completionTokens || 0);
            const total = Number(data?.totalTokens || prompt + completion);
            result.push({ date: k, promptTokens: prompt, completionTokens: completion, totalTokens: total, costUSD: computeCostUSD(prompt, completion) });
          } catch {
            result.push({ date: k, promptTokens: 0, completionTokens: 0, totalTokens: 0, costUSD: "$0.0000" });
          }
        }
        setRows(result);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [db, userId]);

  const exportCsv = () => {
    const headers = ["date","promptTokens","completionTokens","totalTokens","costUSD"];
    const data = rows.map(r => [r.date, String(r.promptTokens), String(r.completionTokens), String(r.totalTokens), r.costUSD]);
    const csv = [headers.join(","), ...data.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-${userId}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGate minRole="admin" redirectTo="/">
      <div className="mx-auto w-full max-w-full sm:max-w-[1024px] px-3 sm:px-4 md:px-0 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">User Usage Detail</h1>
          <Button size="sm" variant="flat" onPress={() => router.back()}>Back</Button>
        </div>
        <Card>
          <CardBody>
            <div className="text-sm text-default-500">User</div>
            <div className="text-base font-medium">{userId}</div>
            {profile && (
              <div className="mt-2 text-sm text-default-600">
                {(profile.firstName || "")} {(profile.lastName || "")} · {profile.email || ""}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Daily tokens & cost (last 30 days)</h2>
              <Button size="sm" variant="flat" onPress={exportCsv}>Export CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-default-200">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Prompt Tokens</th>
                    <th className="py-2 pr-4">Completion Tokens</th>
                    <th className="py-2 pr-4">Total Tokens</th>
                    <th className="py-2 pr-4">Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date} className="border-b border-default-100">
                      <td className="py-2 pr-4">{r.date}</td>
                      <td className="py-2 pr-4">{r.promptTokens}</td>
                      <td className="py-2 pr-4">{r.completionTokens}</td>
                      <td className="py-2 pr-4">{r.totalTokens}</td>
                      <td className="py-2 pr-4">{r.costUSD}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthGate>
  );
}


