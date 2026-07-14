'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useSupabase } from '@/hooks/useSupabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface ReportedQuestion {
  id: number
  question_id: number
  question_text_id: string
  report_count: number
  created_at: string
  updated_at: string
  question: string
  category: string
}

export default function ReportedQuestionsPage() {
  const [reportedQuestions, setReportedQuestions] = useState<ReportedQuestion[]>([])
  const { getReportedQuestions, loading } = useSupabase()

  useEffect(() => {
    const fetchReportedQuestions = async () => {
      const data = await getReportedQuestions()
      if (data) {
        setReportedQuestions(data)
      }
    }

    fetchReportedQuestions()
  }, [getReportedQuestions])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" />
            Reported Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>First Reported</TableHead>
                <TableHead>Last Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportedQuestions.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.question}</TableCell>
                  <TableCell>{report.category}</TableCell>
                  <TableCell>{report.report_count}</TableCell>
                  <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(report.updated_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
