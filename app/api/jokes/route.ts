import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET() {
	try {
		const db = getAdminDb();
		const snap = await db.collection("dadJokes").orderBy("createdAt", "asc").get();
		const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
		return NextResponse.json({ items });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


