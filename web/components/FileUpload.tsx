/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
	onUploadSuccess: (conversionId: string, files: any[]) => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
	const [files, setFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const pdfFiles = acceptedFiles.filter(
			(file) => file.type === "application/pdf"
		);

		if (pdfFiles.length !== acceptedFiles.length) {
			toast.error("PDFファイルのみアップロード可能です");
		}

		setFiles((prev) => [...prev, ...pdfFiles]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
		},
		multiple: true,
	});

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			toast.error("アップロードするPDFファイルを選択してください");
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			files.forEach((file) => {
				formData.append("files", file);
			});

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			const result = await response.json();

			if (result.success) {
				toast.success(
					`${files.length}個のファイルをアップロードしました`
				);
				onUploadSuccess(result.conversionId, result.files);
				setFiles([]);
			} else {
				toast.error(result.error || "アップロードに失敗しました");
			}
		} catch (error) {
			console.error("アップロードエラー:", error);
			toast.error("アップロードに失敗しました");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<div className="space-y-4">
			{/* ドラッグドロップエリア */}
			<Card>
				<CardContent className="pt-6">
					<div
						{...getRootProps()}
						className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
							isDragActive
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-primary/50"
						}`}
					>
						<input {...getInputProps()} />
						<Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
						{isDragActive ? (
							<p className="text-lg">
								PDFファイルをドロップしてください...
							</p>
						) : (
							<div>
								<p className="text-lg mb-2">
									PDFファイルをドラッグ＆ドロップ
								</p>
								<p className="text-sm text-muted-foreground mb-4">
									または、クリックしてファイルを選択
								</p>
								<Button variant="outline">
									ファイルを選択
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 選択されたファイル一覧 */}
			{files.length > 0 && (
				<Card>
					<CardContent className="pt-6">
						<Label className="text-sm font-medium mb-3 block">
							選択されたファイル ({files.length}個)
						</Label>
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{files.map((file, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-2 bg-muted rounded-md"
								>
									<div className="flex items-center space-x-2">
										<File className="h-4 w-4" />
										<span className="text-sm truncate max-w-xs">
											{file.name}
										</span>
										<span className="text-xs text-muted-foreground">
											(
											{(file.size / 1024 / 1024).toFixed(
												2
											)}{" "}
											MB)
										</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => removeFile(index)}
										className="h-6 w-6 p-0"
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* アップロードボタン */}
			<Button
				onClick={handleUpload}
				disabled={files.length === 0 || isUploading}
				className="w-full"
				size="lg"
			>
				{isUploading
					? "アップロード中..."
					: `${files.length}個のファイルをアップロード`}
			</Button>
		</div>
	);
}
