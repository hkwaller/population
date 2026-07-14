import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const generateTriviaQuestion = async (
  topic: string,
  category: string,
  amount: number,
  previousQuestions: string[] = [],
) => {
  const previousQuestionsText =
    previousQuestions.length > 0
      ? `\nAvoid these previously used questions: ${JSON.stringify(previousQuestions.join(','))}`
      : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You generate unique trivia questions with numeric answers, ensuring no duplicates by comparing each new question against a provided list of existing questions. Answers are provided as whole numbers, and if a very large answer is required, it will be converted to an appropriate magnitude, such as millions or billions.
You should respond in JSON and in this format: {"questions": [{"question": string, "answer": number}], "category": string, "error": string} - where questions is an array of questions with answers, category is always exactly "${category}" (do not change this value), and error is a string that is only present if you could not generate any questions.
All these values should be present in the response, even if the error value is present. Respond with only the JSON, no markdown or code blocks.`,
    messages: [
      {
        role: 'user',
        content: `I would like ${amount} questions about ${topic}. ${previousQuestionsText}`,
      },
    ],
  })

  try {
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')
    const parsedContent = JSON.parse(content.text)
    return parsedContent
  } catch (error) {
    console.error('Error parsing Claude response:', error)
    throw new Error('Failed to parse questions from Claude')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, topic, category, amount, previousQuestions } = await req.json()
    const resolvedTopic = topic ?? prompt // backwards compat with existing generate page

    const questions = await generateTriviaQuestion(
      resolvedTopic,
      category,
      amount,
      previousQuestions,
    )

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
