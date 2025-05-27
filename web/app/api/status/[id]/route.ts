/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: conversionId } = await params;

		if (!conversionId) {
			return NextResponse.json(
				{ error: "変換IDが指定されていません" },
				{ status: 400 }
			);
		}

		const uploadDir = path.join(process.cwd(), "uploads", conversionId);
		const jobInfoPath = path.join(uploadDir, "job.json");

		try {
			const jobData = await readFile(jobInfoPath, "utf8");
			const jobInfo = JSON.parse(jobData);

			return NextResponse.json({
				success: true,
				job: jobInfo,
			});
		} catch (error) {
			return NextResponse.json(
				{ error: "変換ジョブが見つかりません" },
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("ステータス取得エラー:", error);
		return NextResponse.json(
			{ error: "ステータスの取得に失敗しました" },
			{ status: 500 }
		);
	}
}
