import path from "path";
import { mkdir, readdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ConversionOptions {
	format: "png" | "jpeg";
	density: number;
	quality?: number;
}

export interface ConversionResult {
	success: boolean;
	outputFiles: string[];
	error?: string;
}

export class PDFConverter {
	private static readonly DEFAULT_OPTIONS: ConversionOptions = {
		format: "png",
		density: 300,
		quality: 90,
	};

	/**
	 * PDFファイルを画像に変換（ImageMagickを使用）
	 */
	static async convertPDF(
		inputPath: string,
		outputDir: string,
		options: Partial<ConversionOptions> = {}
	): Promise<ConversionResult> {
		try {
			const opts = { ...this.DEFAULT_OPTIONS, ...options };

			// 出力ディレクトリを作成
			await mkdir(outputDir, { recursive: true });

			// ファイル名のベース部分を取得
			const baseName = path.basename(inputPath, ".pdf");
			const outputPattern = path.join(
				outputDir,
				`${baseName}-%03d.${opts.format}`
			);

			// ImageMagickのconvertコマンドを構築
			let convertCommand = `convert -density ${opts.density}`;

			// 白色背景を設定し、透過を無効化
			convertCommand += ` -background white -alpha remove -alpha off`;

			// 品質設定（JPEGの場合）
			if (opts.format === "jpeg" && opts.quality) {
				convertCommand += ` -quality ${opts.quality}`;
			}

			// PNG最適化設定
			if (opts.format === "png") {
				convertCommand += ` -compress zip`;
			}

			convertCommand += ` "${inputPath}" "${outputPattern}"`;

			console.log(`PDF変換実行: ${convertCommand}`);

			// ImageMagickで変換実行
			const { stderr } = await execAsync(convertCommand);

			if (stderr && !stderr.includes("Warning")) {
				console.warn("ImageMagick警告:", stderr);
			}

			// 出力ファイル一覧を取得
			const outputFiles = await this.getOutputFiles(
				outputDir,
				baseName,
				opts.format
			);

			if (outputFiles.length === 0) {
				throw new Error("変換されたファイルが見つかりません");
			}

			console.log(`変換完了: ${outputFiles.length}ページ`);

			return {
				success: true,
				outputFiles,
			};
		} catch (error) {
			console.error("PDF変換エラー:", error);
			return {
				success: false,
				outputFiles: [],
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * 出力ファイル一覧を取得
	 */
	private static async getOutputFiles(
		outputDir: string,
		baseName: string,
		format: string
	): Promise<string[]> {
		try {
			const files = await readdir(outputDir);
			const outputFiles = files
				.filter(
					(file) =>
						file.startsWith(baseName) && file.endsWith(`.${format}`)
				)
				.sort()
				.map((file) => path.join(outputDir, file));

			return outputFiles;
		} catch (error) {
			console.error("出力ファイル取得エラー:", error);
			return [];
		}
	}

	/**
	 * 複数のPDFファイルを一括変換
	 */
	static async convertMultiplePDFs(
		files: Array<{ path: string; name: string }>,
		outputDir: string,
		options: Partial<ConversionOptions> = {},
		onProgress?: (current: number, total: number, fileName: string) => void
	): Promise<{
		success: boolean;
		results: Array<{ file: string; result: ConversionResult }>;
	}> {
		const results: Array<{ file: string; result: ConversionResult }> = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			console.log(`変換開始: ${file.name} (${i + 1}/${files.length})`);

			const result = await this.convertPDF(file.path, outputDir, options);

			results.push({ file: file.name, result });

			if (result.success) {
				console.log(
					`変換成功: ${file.name} - ${result.outputFiles.length}ファイル生成`
				);
			} else {
				console.error(`変換失敗: ${file.name} - ${result.error}`);
			}

			// 進捗コールバック（変換完了後に呼び出し）
			if (onProgress) {
				onProgress(i + 1, files.length, file.name);
			}
		}

		const successCount = results.filter((r) => r.result.success).length;
		const allSuccess = results.every((r) => r.result.success);

		console.log(
			`一括変換完了: ${successCount}/${files.length}ファイル成功`
		);

		return {
			success: allSuccess,
			results,
		};
	}

	/**
	 * サポートされている形式かチェック
	 */
	static isSupportedFormat(format: string): format is "png" | "jpeg" {
		return ["png", "jpeg", "jpg"].includes(format.toLowerCase());
	}

	/**
	 * PDFファイルの情報を取得（ImageMagickのidentifyコマンドを使用）
	 */
	static async getPDFInfo(
		filePath: string
	): Promise<{ pageCount?: number; error?: string }> {
		try {
			// ImageMagickのidentifyコマンドでページ数を取得
			const identifyCommand = `identify "${filePath}"`;
			const { stdout, stderr } = await execAsync(identifyCommand);

			if (stderr && !stderr.includes("Warning")) {
				throw new Error(stderr);
			}

			// 出力行数がページ数
			const pageCount = stdout.trim().split("\n").length;

			return { pageCount };
		} catch (error) {
			console.error("PDF情報取得エラー:", error);
			return {
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * ImageMagickが利用可能かチェック
	 */
	static async checkImageMagickAvailability(): Promise<{
		available: boolean;
		version?: string;
		error?: string;
	}> {
		try {
			const { stdout } = await execAsync("convert -version");
			const versionMatch = stdout.match(/Version: ImageMagick ([\d.]+)/);
			const version = versionMatch ? versionMatch[1] : "Unknown";

			return { available: true, version };
		} catch {
			return {
				available: false,
				error: "ImageMagickが見つかりません。インストールされているか確認してください。",
			};
		}
	}
}
