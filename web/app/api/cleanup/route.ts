import { NextResponse } from "next/server";
import { cleanupOldFiles } from "@/lib/cleanup";

export async function POST() {
	try {
		await cleanupOldFiles();

		return NextResponse.json({
			success: true,
			message: "クリーンアップが完了しました",
		});
	} catch (error) {
		console.error("クリーンアップAPIエラー:", error);

		return NextResponse.json(
			{ error: "クリーンアップに失敗しました" },
			{ status: 500 }
		);
	}
}
