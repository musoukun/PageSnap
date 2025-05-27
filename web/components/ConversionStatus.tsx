"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, CheckCircle, XCircle, Play } from "lucide-react";
import { toast } from "sonner";

interface ConversionStatusProps {
	conversionId: string;
}

interface JobStatus {
	id: string;
	status: "uploaded" | "processing" | "completed" | "error";
	progress: number;
	files: Array<{ name: string; size: number }>;
	createdAt: string;
	startedAt?: string;
	completedAt?: string;
	error?: string;
	format?: string;
}

export function ConversionStatus({ conversionId }: ConversionStatusProps) {
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isConverting, setIsConverting] = useState(false);
	const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg">("png");

	// ステータスを取得
	const fetchStatus = useCallback(async () => {
		try {
			const response = await fetch(`/api/status/${conversionId}`);
			const result = await response.json();

			if (result.success) {
				setJobStatus(result.job);
			} else {
				toast.error(result.error || "ステータスの取得に失敗しました");
			}
		} catch (error) {
			console.error("ステータス取得エラー:", error);
			toast.error("ステータスの取得に失敗しました");
		} finally {
			setIsLoading(false);
		}
	}, [conversionId]);

	// 変換開始
	const startConversion = async () => {
		setIsConverting(true);
		try {
			const response = await fetch("/api/convert", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					conversionId,
					format: selectedFormat,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success("変換処理を開始しました");
				await fetchStatus();
			} else {
				toast.error(result.error || "変換の開始に失敗しました");
			}
		} catch (error) {
			console.error("変換開始エラー:", error);
			toast.error("変換の開始に失敗しました");
		} finally {
			setIsConverting(false);
		}
	};

	// ダウンロード
	const downloadZip = async () => {
		try {
			const response = await fetch(`/api/download/${conversionId}`);

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `converted_images_${conversionId}.zip`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("ダウンロードを開始しました");
			} else {
				const result = await response.json();
				toast.error(result.error || "ダウンロードに失敗しました");
			}
		} catch (error) {
			console.error("ダウンロードエラー:", error);
			toast.error("ダウンロードに失敗しました");
		}
	};

	// 定期的にステータスを更新
	useEffect(() => {
		fetchStatus();

		const interval = setInterval(() => {
			if (jobStatus?.status === "processing") {
				fetchStatus();
			}
		}, 2000);

		return () => clearInterval(interval);
	}, [conversionId, jobStatus?.status, fetchStatus]);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "uploaded":
				return (
					<Badge variant="secondary">
						<Clock className="w-3 h-3 mr-1" />
						待機中
					</Badge>
				);
			case "processing":
				return (
					<Badge variant="default">
						<Play className="w-3 h-3 mr-1" />
						処理中
					</Badge>
				);
			case "completed":
				return (
					<Badge variant="default" className="bg-green-500">
						<CheckCircle className="w-3 h-3 mr-1" />
						完了
					</Badge>
				);
			case "error":
				return (
					<Badge variant="destructive">
						<XCircle className="w-3 h-3 mr-1" />
						エラー
					</Badge>
				);
			default:
				return <Badge variant="outline">不明</Badge>;
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-center">読み込み中...</p>
				</CardContent>
			</Card>
		);
	}

	if (!jobStatus) {
		return (
			<Card>
				<CardContent className="pt-6">
					<Alert>
						<AlertDescription>
							指定された変換IDのジョブが見つかりませんでした。
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{/* 変換ID表示 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						変換ジョブ
						{getStatusBadge(jobStatus.status)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-3 rounded-md">
						<p className="text-sm font-medium mb-1">変換ID</p>
						<p className="font-mono text-sm break-all">
							{conversionId}
						</p>
					</div>

					<Alert>
						<AlertDescription>
							📝
							ブラウザを閉じても変換状況を確認できます。キャッシュ削除する場合は上記のIDをメモして入力してください。
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>

			{/* ファイル一覧 */}
			<Card>
				<CardHeader>
					<CardTitle>
						アップロード済みファイル ({jobStatus.files.length}個)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 max-h-40 overflow-y-auto">
						{jobStatus.files.map((file, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-2 bg-muted rounded-md"
							>
								<span className="text-sm truncate">
									{file.name}
								</span>
								<span className="text-xs text-muted-foreground">
									{(file.size / 1024 / 1024).toFixed(2)} MB
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* 変換設定・開始 */}
			{jobStatus.status === "uploaded" && (
				<Card>
					<CardHeader>
						<CardTitle>変換設定</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<label className="text-sm font-medium mb-2 block">
								出力形式
							</label>
							<div className="flex space-x-2">
								<Button
									variant={
										selectedFormat === "png"
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => setSelectedFormat("png")}
								>
									PNG
								</Button>
								<Button
									variant={
										selectedFormat === "jpeg"
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => setSelectedFormat("jpeg")}
								>
									JPEG
								</Button>
							</div>
						</div>

						<Button
							onClick={startConversion}
							disabled={isConverting}
							className="w-full"
							size="lg"
						>
							{isConverting ? "変換開始中..." : "画像変換を開始"}
						</Button>
					</CardContent>
				</Card>
			)}

			{/* 進捗表示 */}
			{jobStatus.status === "processing" && (
				<Card>
					<CardHeader>
						<CardTitle>変換進捗</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex justify-between text-sm mb-2">
								<span>進捗</span>
								<span>{jobStatus.progress}%</span>
							</div>
							<Progress
								value={jobStatus.progress}
								className="w-full"
							/>
						</div>
						<p className="text-sm text-muted-foreground">
							変換形式: {jobStatus.format?.toUpperCase() || "PNG"}
						</p>
					</CardContent>
				</Card>
			)}

			{/* 完了・ダウンロード */}
			{jobStatus.status === "completed" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-green-600">
							変換完了
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>
								すべてのPDFファイルの変換が完了しました！
							</AlertDescription>
						</Alert>

						<Button
							onClick={downloadZip}
							className="w-full"
							size="lg"
						>
							<Download className="w-4 h-4 mr-2" />
							ZIPファイルをダウンロード
						</Button>
					</CardContent>
				</Card>
			)}

			{/* エラー表示 */}
			{jobStatus.status === "error" && (
				<Card>
					<CardHeader>
						<CardTitle className="text-red-600">
							エラーが発生しました
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Alert variant="destructive">
							<XCircle className="h-4 w-4" />
							<AlertDescription>
								{jobStatus.error ||
									"変換処理中にエラーが発生しました"}
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
