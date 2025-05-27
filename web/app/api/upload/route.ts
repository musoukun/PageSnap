import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'PDFファイルが選択されていません' },
        { status: 400 }
      )
    }

    // 一意のIDを生成
    const conversionId = uuidv4()
    
    // アップロードディレクトリを作成
    const uploadDir = path.join(process.cwd(), 'uploads', conversionId)
    await mkdir(uploadDir, { recursive: true })

    // ファイルを保存
    const savedFiles = []
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: `${file.name} はPDFファイルではありません` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = path.join(uploadDir, file.name)
      
      await writeFile(filePath, buffer)
      savedFiles.push({
        name: file.name,
        size: file.size,
        path: filePath
      })
    }

    // 変換ジョブの情報を保存
    const jobInfo = {
      id: conversionId,
      status: 'uploaded',
      files: savedFiles,
      createdAt: new Date().toISOString(),
      progress: 0
    }

    const jobInfoPath = path.join(uploadDir, 'job.json')
    await writeFile(jobInfoPath, JSON.stringify(jobInfo, null, 2))

    return NextResponse.json({
      success: true,
      conversionId,
      files: savedFiles.map(f => ({ name: f.name, size: f.size }))
    })

  } catch (error) {
    console.error('アップロードエラー:', error)
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}
