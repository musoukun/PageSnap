'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

interface IdInputProps {
  onIdSubmit: (id: string) => void
}

export function IdInput({ onIdSubmit }: IdInputProps) {
  const [inputId, setInputId] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputId.trim()) {
      toast.error('変換IDを入力してください')
      return
    }

    setIsValidating(true)
    
    try {
      // IDの存在確認
      const response = await fetch(`/api/status/${inputId.trim()}`)
      const result = await response.json()
      
      if (result.success) {
        toast.success('変換ジョブが見つかりました')
        onIdSubmit(inputId.trim())
        setInputId('')
      } else {
        toast.error('指定された変換IDのジョブが見つかりませんでした')
      }
    } catch (error) {
      console.error('ID検証エラー:', error)
      toast.error('変換IDの確認に失敗しました')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="conversion-id" className="text-sm font-medium">
              変換ID
            </Label>
            <Input
              id="conversion-id"
              type="text"
              placeholder="変換IDを入力してください (例: 550e8400-e29b-41d4-a716-446655440000)"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              PDF変換時に表示された一意のIDを入力してください
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={!inputId.trim() || isValidating}
            className="w-full"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            {isValidating ? '確認中...' : '変換状況を確認'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
