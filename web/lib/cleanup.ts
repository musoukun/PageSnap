import { readdir, stat, rm } from "fs/promises";
import path from "path";

const RETENTION_DAYS = parseInt(process.env.PDF_RETENTION_DAYS || "2");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function cleanupOldFiles() {
	try {
		console.log(
			`古いファイルのクリーンアップを開始 (保持期間: ${RETENTION_DAYS}日)`
		);

		const entries = await readdir(UPLOADS_DIR);
		const now = new Date();
		let deletedCount = 0;

		for (const entry of entries) {
			const entryPath = path.join(UPLOADS_DIR, entry);

			try {
				const stats = await stat(entryPath);

				if (stats.isDirectory()) {
					const daysSinceCreation =
						(now.getTime() - stats.birthtime.getTime()) /
						(1000 * 60 * 60 * 24);

					if (daysSinceCreation > RETENTION_DAYS) {
						await rm(entryPath, { recursive: true, force: true });
						console.log(
							`削除済み: ${entry} (作成から${Math.floor(daysSinceCreation)}日経過)`
						);
						deletedCount++;
					}
				}
			} catch (error) {
				console.error(`エラー: ${entry} の処理中にエラーが発生`, error);
			}
		}

		console.log(
			`クリーンアップ完了: ${deletedCount}個のディレクトリを削除`
		);
	} catch (error) {
		console.error("クリーンアップエラー:", error);
	}
}

// 定期実行の場合（環境変数で有効化）
if (process.env.ENABLE_CLEANUP === "true") {
	console.log("定期クリーンアップを開始");

	// 1日に1回実行
	setInterval(cleanupOldFiles, 24 * 60 * 60 * 1000);

	// 起動時に1回実行
	cleanupOldFiles();
}
