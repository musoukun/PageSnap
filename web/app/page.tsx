"use client";

import { useState, useCallback, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ConversionStatus } from "@/components/ConversionStatus";
import { IdInput } from "@/components/IdInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
	const [conversionId, setConversionId] = useState<string>("");
	const [activeTab, setActiveTab] = useState("upload");

	// LocalStorageから変換IDを復元
	useEffect(() => {
		const savedId = localStorage.getItem("pdf2img_conversion_id");
		if (savedId) {
			setConversionId(savedId);
			setActiveTab("status");
		}
	}, []);

	// 変換IDをLocalStorageに保存
	const saveConversionId = useCallback((id: string) => {
		localStorage.setItem("pdf2img_conversion_id", id);
		setConversionId(id);
	}, []);

	const handleUploadSuccess = useCallback(
		(id: string) => {
			saveConversionId(id);
			setActiveTab("status");
		},
		[saveConversionId]
	);

	const handleIdSubmit = useCallback(
		(id: string) => {
			saveConversionId(id);
			setActiveTab("status");
		},
		[saveConversionId]
	);

	return (
		<div className="container mx-auto py-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-center mb-8">
					PDF to Image Converter
				</h1>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="upload">アップロード</TabsTrigger>
						<TabsTrigger value="status">変換状況</TabsTrigger>
						<TabsTrigger value="id">ID入力</TabsTrigger>
					</TabsList>

					<TabsContent value="upload" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>PDFファイルをアップロード</CardTitle>
							</CardHeader>
							<CardContent>
								<FileUpload
									onUploadSuccess={handleUploadSuccess}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="status" className="space-y-4">
						{conversionId ? (
							<ConversionStatus conversionId={conversionId} />
						) : (
							<Card>
								<CardContent className="pt-6">
									<p className="text-center text-muted-foreground">
										変換IDがありません。アップロードまたはID入力をしてください。
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="id" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>変換ID入力</CardTitle>
							</CardHeader>
							<CardContent>
								<IdInput onIdSubmit={handleIdSubmit} />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
