import { useState } from 'react'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import { useToast } from '@/hooks/use-toast'
import { useIshStore } from '@/app/state'

export function ReportButton() {
  const { currentQuestion } = useIshStore()
  const [isReporting, setIsReporting] = useState(false)
  const { reportQuestion } = useSupabase()
  const { toast } = useToast()

  const handleReport = async () => {
    setIsReporting(true)
    try {
      await reportQuestion(currentQuestion.question)
      toast({
        title: 'Question reported',
        description: 'Thank you for helping improve the game.',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to report question. Please try again.',
        variant: 'destructive',
        duration: 2000,
      })
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReport}
      disabled={isReporting}
      className="text-muted-foreground hover:text-destructive"
    >
      <AlertCircle className="w-4 h-4 mr-2" />
      Report Question
    </Button>
  )
}
