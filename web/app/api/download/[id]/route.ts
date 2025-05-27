/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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
		const zipPath = path.join(uploadDir, "converted_images.zip");

		// ジョブ情報を確認
		try {
			const jobData = await readFile(jobInfoPath, "utf8");
			const jobInfo = JSON.parse(jobData);

			if (jobInfo.status !== "completed") {
				return NextResponse.json(
					{ error: "変換がまだ完了していません" },
					{ status: 400 }
				);
			}
		} catch (error) {
			return NextResponse.json(
				{ error: "変換ジョブが見つかりません" },
				{ status: 404 }
			);
		}

		// ZIPファイルの存在確認
		if (!existsSync(zipPath)) {
			return NextResponse.json(
				{ error: "ダウンロードファイルが見つかりません" },
				{ status: 404 }
			);
		}

		// ファイルを読み込んでレスポンスとして返す
		const fileBuffer = await readFile(zipPath);

		return new NextResponse(fileBuffer, {
			status: 200,
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="converted_images_${conversionId}.zip"`,
				"Content-Length": fileBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("ダウンロードエラー:", error);
		return NextResponse.json(
			{ error: "ダウンロードに失敗しました" },
			{ status: 500 }
		);
	}
}
