/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { PDFConverter } from "@/lib/pdf-converter";

export async function POST(request: NextRequest) {
	try {
		const { conversionId, format = "png" } = await request.json();

		if (!conversionId) {
			return NextResponse.json(
				{ error: "変換IDが指定されていません" },
				{ status: 400 }
			);
		}

		// フォーマットの検証
		if (!PDFConverter.isSupportedFormat(format)) {
			return NextResponse.json(
				{ error: "サポートされていない形式です" },
				{ status: 400 }
			);
		}

		const uploadDir = path.join(process.cwd(), "uploads", conversionId);
		const jobInfoPath = path.join(uploadDir, "job.json");

		// ジョブ情報を読み込み
		let jobInfo;
		try {
			const jobData = await readFile(jobInfoPath, "utf8");
			jobInfo = JSON.parse(jobData);
		} catch (error) {
			return NextResponse.json(
				{ error: "変換ジョブが見つかりません" },
				{ status: 404 }
			);
		}

		// 既に処理中または完了している場合
		if (jobInfo.status === "processing" || jobInfo.status === "completed") {
			return NextResponse.json({
				success: true,
				status: jobInfo.status,
				progress: jobInfo.progress,
			});
		}

		// ImageMagickの可用性をチェック
		const magickCheck = await PDFConverter.checkImageMagickAvailability();
		if (!magickCheck.available) {
			return NextResponse.json(
				{ error: magickCheck.error || "ImageMagickが利用できません" },
				{ status: 500 }
			);
		}

		console.log(`ImageMagick利用可能: ${magickCheck.version}`);

		// ステータスを処理中に更新
		jobInfo.status = "processing";
		jobInfo.startedAt = new Date().toISOString();
		jobInfo.format = format;
		await writeFile(jobInfoPath, JSON.stringify(jobInfo, null, 2));

		// バックグラウンドで変換処理を開始
		processConversion(conversionId, jobInfo, format);

		return NextResponse.json({
			success: true,
			status: "processing",
			message: "変換処理を開始しました",
		});
	} catch (error) {
		console.error("変換開始エラー:", error);
		return NextResponse.json(
			{ error: "変換処理の開始に失敗しました" },
			{ status: 500 }
		);
	}
}

async function processConversion(
	conversionId: string,
	jobInfo: any,
	format: string
) {
	const uploadDir = path.join(process.cwd(), "uploads", conversionId);
	const outputDir = path.join(uploadDir, "output");
	const jobInfoPath = path.join(uploadDir, "job.json");

	try {
		// 出力ディレクトリ作成
		await mkdir(outputDir, { recursive: true });

		console.log(
			`変換開始: ${jobInfo.files.length}ファイル, 形式: ${format}`
		);

		// PDFConverterを使用して一括変換
		const conversionResult = await PDFConverter.convertMultiplePDFs(
			jobInfo.files,
			outputDir,
			{
				format: format as "png" | "jpeg",
				density: 300,
				quality: format === "jpeg" ? 90 : undefined,
			},
			(current, total, fileName) => {
				// 進捗更新
				const progress = Math.round((current / total) * 100);
				jobInfo.progress = progress;

				// 非同期でジョブ情報を更新（エラーは無視）
				writeFile(jobInfoPath, JSON.stringify(jobInfo, null, 2)).catch(
					(err) => console.error("進捗更新エラー:", err)
				);

				console.log(
					`進捗: ${current}/${total} - ${fileName} (${progress}%)`
				);
			}
		);

		// 変換結果をログ出力
		console.log(`変換結果: 成功=${conversionResult.success}`);
		conversionResult.results.forEach((result) => {
			if (result.result.success) {
				console.log(
					`✓ ${result.file}: ${result.result.outputFiles.length}ページ`
				);
			} else {
				console.error(`✗ ${result.file}: ${result.result.error}`);
			}
		});

		// ZIP圧縮
		const zipPath = path.join(uploadDir, "converted_images.zip");
		await createZipArchive(outputDir, zipPath);

		// 完了状態に更新
		jobInfo.status = "completed";
		jobInfo.completedAt = new Date().toISOString();
		jobInfo.progress = 100;
		jobInfo.zipPath = zipPath;
		jobInfo.conversionResults = conversionResult.results;
		await writeFile(jobInfoPath, JSON.stringify(jobInfo, null, 2));

		console.log(`変換完了: ${conversionId}`);
	} catch (error: any) {
		console.error("変換処理エラー:", error);
		jobInfo.status = "error";
		jobInfo.error = error.message;
		await writeFile(jobInfoPath, JSON.stringify(jobInfo, null, 2));
	}
}

// ZIP作成関数
function createZipArchive(
	sourceDir: string,
	outputPath: string
): Promise<void> {
	return new Promise((resolve, reject) => {
		const output = createWriteStream(outputPath);
		const archive = archiver("zip", { zlib: { level: 9 } });

		output.on("close", () => {
			console.log(`ZIP作成完了: ${archive.pointer()} bytes`);
			resolve();
		});

		archive.on("error", (err) => {
			reject(err);
		});

		archive.pipe(output);
		archive.directory(sourceDir, false);
		archive.finalize();
	});
}
