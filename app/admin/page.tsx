"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  collection,
  collectionGroup,
  doc,
  deleteDoc,
  getCountFromServer,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import AuthGate from "@/lib/authz/AuthGate";

type UserRow = {
  userProfileId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  lastLoginAt: Date | null;
  role: string | null;
  isAdmin: boolean;
  totalTokens?: number;
};

type DayStat = { label: string; start: Date; end: Date; count: number | null };

// Pricing config for gpt-5-mini (example). Adjust to your actual pricing.
// Values are USD per 1,000 tokens.
const GPT5_MINI_INPUT_PER_1K = 0.00015; // example
const GPT5_MINI_OUTPUT_PER_1K = 0.0006; // example

function computeCostNumber(totalTokens: number): number {
  return (totalTokens / 1000) * GPT5_MINI_OUTPUT_PER_1K;
}

function computeCostUSD(totalTokens: number): string {
  // If you want to separate input/output, store both. For now, approximate using totalTokens at output rate.
  const dollars = computeCostNumber(totalTokens);
  return `$${dollars.toFixed(4)}`;
}

function formatCostUSD(totalTokens: number): string {
  return computeCostUSD(totalTokens);
}

export default function AdminPage() {
  const db = useMemo(() => getFirebaseDb(), []);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);
  const [usersRaw, setUsersRaw] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Table UI state
  const [filterText, setFilterText] = useState<string>("");
  const [sortBy, setSortBy] = useState<keyof UserRow>("lastName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Time series state
  const [dau, setDau] = useState<DayStat[]>([]);
  const [chatsPerDay, setChatsPerDay] = useState<DayStat[]>([]);
  const [tokensPerDay, setTokensPerDay] = useState<DayStat[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const usersCol = collection(db, "userProfiles");
        const usersAgg = await getCountFromServer(usersCol);
        setUserCount(usersAgg.data().count);

        // Total chats via collection group
        try {
          const chatsAgg = await getCountFromServer(collectionGroup(db, "chats"));
          setChatCount(chatsAgg.data().count);
        } catch {
          setChatCount(null);
        }

        // Load users (cap for client-side sorting/filtering)
        const usersSnap = await getDocs(query(usersCol, limit(1000)));
        const rows: UserRow[] = usersSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            userProfileId: data.userProfileId || d.id,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            displayName: data.displayName ?? null,
            email: data.email ?? null,
            lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : null,
            role: data.role ?? null,
            isAdmin: data.isAdmin === true,
            totalTokens: undefined,
          };
        });
        // fetch usage totals
        try {
          const usageDocs = await getDocs(collection(db, "usage"));
          const usageMap = new Map<string, number>();
          usageDocs.forEach((ud) => {
            const udata = ud.data() as any;
            const total = Number(udata?.totalTokens || 0);
            usageMap.set(ud.id, total);
          });
          rows.forEach((r) => {
            r.totalTokens = usageMap.get(r.userProfileId) || 0;
          });
        } catch {}
        setUsersRaw(rows);

        // Build last 7 days windows
        const dayWindows: Array<{ start: Date; end: Date; label: string }> = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const start = new Date(today);
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - i);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          dayWindows.push({ start, end, label: start.toLocaleDateString() });
        }

        // Count DAU per day
        const dauCounts = await Promise.all(
          dayWindows.map(async (w) => {
            try {
              const c = await getCountFromServer(
                query(
                  usersCol,
                  where("lastLoginAt", ">=", w.start),
                  where("lastLoginAt", "<", w.end),
                ),
              );
              return c.data().count;
            } catch {
              return null;
            }
          }),
        );
        setDau(dayWindows.map((w, idx) => ({ ...w, count: dauCounts[idx] })));

        // Count chats per day via collection group ranges
        const chatsCG = collectionGroup(db, "chats");
        const chatsCounts = await Promise.all(
          dayWindows.map(async (w) => {
            try {
              const c = await getCountFromServer(
                query(
                  chatsCG,
                  where("createdAt", ">=", w.start),
                  where("createdAt", "<", w.end),
                ),
              );
              return c.data().count;
            } catch {
              return null;
            }
          }),
        );
        setChatsPerDay(dayWindows.map((w, idx) => ({ ...w, count: chatsCounts[idx] })));

        // Tokens per day from usageDaily
        const tokensCounts = await Promise.all(
          dayWindows.map(async (w) => {
            try {
              const dateKey = w.start.toISOString().slice(0, 10);
              const dailyUsers = await getDocs(collection(db, "usageDaily", dateKey, "users"));
              let sum = 0;
              dailyUsers.forEach((d) => {
                const data = d.data() as any;
                sum += Number(data?.totalTokens || 0);
              });
              return sum;
            } catch {
              return null;
            }
          }),
        );
        setTokensPerDay(dayWindows.map((w, idx) => ({ ...w, count: tokensCounts[idx] })));
      } catch {
        setUserCount(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [db]);

  const filteredSorted = useMemo(() => {
    const needle = filterText.trim().toLowerCase();
    let arr = usersRaw;
    if (needle) {
      arr = arr.filter((u) =>
        [u.firstName, u.lastName, u.displayName, u.email, u.userProfileId]
          .map((x) => (x || "").toString().toLowerCase())
          .some((x) => x.includes(needle)),
      );
    }
    const sorted = [...arr].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return sorted;
  }, [usersRaw, filterText, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, currentPage, pageSize]);

  const toggleSort = (key: keyof UserRow) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const onChangeRole = async (uid: string, next: string) => {
    try {
      const isAdmin = next === "admin";
      await setDoc(
        doc(db, "userProfiles", uid),
        { role: next, isAdmin },
        { merge: true },
      );
      setUsersRaw((rows) => rows.map((r) => (r.userProfileId === uid ? { ...r, role: next, isAdmin } : r)));
    } catch {}
  };

  const onDisableUser = async (uid: string, value: boolean) => {
    try {
      await setDoc(doc(db, "userProfiles", uid), { isDisabled: value }, { merge: true });
      setUsersRaw((rows) => rows.map((r) => (r.userProfileId === uid ? { ...r } : r)));
    } catch {}
  };

  const onDeleteUserData = async (uid: string) => {
    const confirmed = window.confirm("This will delete all user data for this user (profile and chats). Are you sure?");
    if (!confirmed) return;
    try {
      // Client-side delete: delete chats under user and then mark profile as deleted
      // NOTE: For large datasets, move this to a server/admin function
      const chatsQ = await getDocs(collection(db, "userProfiles", uid, "chats"));
      for (const c of chatsQ.docs) {
        try {
          await deleteDoc(doc(db, "userProfiles", uid, "chats", c.id));
        } catch {}
      }
      await setDoc(doc(db, "userProfiles", uid), { deletedAt: new Date(), isDisabled: true }, { merge: true });
      setUsersRaw((rows) => rows.filter((r) => r.userProfileId !== uid));
    } catch {}
  };

  return (
    <AuthGate minRole="admin" redirectTo="/">
      <div className="mx-auto w-full max-w-full sm:max-w-[1344px] lg:max-w-[1536px] px-3 sm:px-4 md:px-0 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="text-sm text-default-500">Total Users</div>
              <div className="text-3xl font-semibold">{userCount ?? (loading ? "…" : "-")}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-default-500">Total Chat Sessions</div>
              <div className="text-3xl font-semibold">{chatCount ?? (loading ? "…" : "-")}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-default-500">DAU (Today)</div>
              <div className="text-3xl font-semibold">{dau[dau.length - 1]?.count ?? (loading ? "…" : "-")}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-default-500">Chats Today</div>
              <div className="text-3xl font-semibold">{chatsPerDay[chatsPerDay.length - 1]?.count ?? (loading ? "…" : "-")}</div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-2">Last 7 days</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-default-500 mb-1">Daily Active Users</div>
                <div className="flex items-end gap-2 h-28">
                  {dau.map((d) => {
                    const h = Math.max(0, Math.min(100, (d.count ?? 0)));
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1">
                        <div className="bg-secondary h-full w-6 rounded-small" style={{ height: `${Math.min(100, h)}%` }} />
                        <div className="text-[10px] text-default-500">{d.label.slice(0, 5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-default-500 mb-1">Chats per Day</div>
                <div className="flex items-end gap-2 h-28">
                  {chatsPerDay.map((d) => {
                    const h = Math.max(0, Math.min(100, (d.count ?? 0)));
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1">
                        <div className="bg-primary h-full w-6 rounded-small" style={{ height: `${Math.min(100, h)}%` }} />
                        <div className="text-[10px] text-default-500">{d.label.slice(0, 5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-default-500 mb-1">Tokens per Day</div>
                <div className="flex items-end gap-2 h-28">
                  {tokensPerDay.map((d) => {
                    const h = Math.max(0, Math.min(100, (d.count ?? 0)));
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1">
                        <div className="bg-default-500 h-full w-6 rounded-small" style={{ height: `${Math.min(100, h)}%` }} />
                        <div className="text-[10px] text-default-500">{d.label.slice(0, 5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-default-500 mb-1">Cost per Day (USD)</div>
                <div className="flex items-end gap-2 h-28">
                  {tokensPerDay.map((d) => {
                    const tokens = d.count ?? 0;
                    const cost = computeCostNumber(tokens);
                    const h = Math.max(0, Math.min(100, cost));
                    return (
                      <div key={d.label} className="flex flex-col items-center gap-1">
                        <div className="bg-success h-full w-6 rounded-small" style={{ height: `${Math.min(100, h)}%` }} />
                        <div className="text-[10px] text-default-500">{d.label.slice(0, 5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">Users</h2>
              <div className="flex items-center gap-2">
                <input
                  value={filterText}
                  onChange={(e) => { setPage(1); setFilterText(e.target.value); }}
                  placeholder="Filter by name, email, or ID"
                  className="border border-default-300 rounded-small px-2 py-1 text-sm bg-transparent"
                />
                <select
                  value={pageSize}
                  onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                  className="border border-default-300 rounded-small px-2 py-1 text-sm bg-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <Button size="sm" variant="flat" onPress={() => window.location.reload()}>Refresh</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-default-200">
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("firstName")}>First Name</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("lastName")}>Last Name</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("displayName")}>Display Name</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("email")}>Email</th>
                    <th className="py-2 pr-4">User ID</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("lastLoginAt")}>Last Login</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort("totalTokens")}>Tokens</th>
                    <th className="py-2 pr-4">Cost (USD)</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice.map((u) => (
                    <tr key={u.userProfileId} className="border-b border-default-100">
                      <td className="py-2 pr-4">{u.firstName || "-"}</td>
                      <td className="py-2 pr-4">{u.lastName || "-"}</td>
                      <td className="py-2 pr-4">{u.displayName || "-"}</td>
                      <td className="py-2 pr-4">{u.email || "-"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        <a href={`/admin/user/${u.userProfileId}`} className="text-primary underline-offset-2 hover:underline">{u.userProfileId}</a>
                      </td>
                      <td className="py-2 pr-4">{u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "-"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={u.isAdmin ? "admin" : (u.role || "viewer")}
                          onChange={(e) => onChangeRole(u.userProfileId, e.target.value)}
                          className="border border-default-300 rounded-small px-2 py-1 text-sm bg-transparent"
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">{u.totalTokens ?? 0}</td>
                      <td className="py-2 pr-4">{formatCostUSD(u.totalTokens ?? 0)}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="flat" onPress={() => onDisableUser(u.userProfileId, true)}>Disable</Button>
                          <Button size="sm" variant="flat" onPress={() => onDisableUser(u.userProfileId, false)}>Enable</Button>
                          <Button size="sm" color="danger" variant="flat" onPress={() => onDeleteUserData(u.userProfileId)}>Delete Data</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageSlice.length === 0 && !loading && (
                    <tr>
                      <td className="py-3 text-default-500" colSpan={7}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" variant="flat" onPress={() => {
                const headers = ["firstName","lastName","displayName","email","userProfileId","lastLoginAt","role","isAdmin","totalTokens","costUSD"];
                const rows = filteredSorted.map(u => [u.firstName||"",u.lastName||"",u.displayName||"",u.email||"",u.userProfileId,u.lastLoginAt?u.lastLoginAt.toISOString():"",u.role||"",String(u.isAdmin),String(u.totalTokens??0),formatCostUSD(u.totalTokens??0)]);
                const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-default-500">
                Page {currentPage} of {totalPages} ({filteredSorted.length} users)
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="flat" isDisabled={currentPage <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <Button size="sm" variant="flat" isDisabled={currentPage >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthGate>
  );
}


