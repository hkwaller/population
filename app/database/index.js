import _ from 'lodash'
import fs from 'fs'
import * as uuid from 'uuid'

import food from './Food.json' assert { type: 'json' }
import general from './General.json' assert { type: 'json' }
import geography from './Geography.json' assert { type: 'json' }
import history from './History.json' assert { type: 'json' }
import music from './Music.json' assert { type: 'json' }
import sports from './Sports.json' assert { type: 'json' }
import technology from './Technology.json' assert { type: 'json' }
import tvMovies from './TV & Movies.json' assert { type: 'json' }
import literature from './Literature.json' assert { type: 'json' }
import famousPeople from './famous-people.json' assert { type: 'json' }
import animals from './animals.json' assert { type: 'json' }
import science from './science.json' assert { type: 'json' }
import soccer from './soccer.json' assert { type: 'json' }
import religion from './religion.json' assert { type: 'json' }

function calculateBounds(question, answer) {
  if (answer >= 0 && answer <= 100) {
    return { lower_bound: 0, upper_bound: 100 }
  }

  if (
    question.toLowerCase().includes('year') ||
    question.toLowerCase().includes('when was') ||
    question.toLowerCase().includes('when did')
  ) {
    const currentYear = new Date().getFullYear()

    if (answer >= 1900 && answer <= currentYear) {
      return {
        lower_bound: 1900,
        upper_bound: currentYear,
      }
    } else {
      const millennium = Math.floor(answer / 1000) * 1000
      return {
        lower_bound: millennium,
        upper_bound: millennium + 1000,
      }
    }
  }

  const order_of_magnitude = Math.floor(Math.log10(answer))
  const lower_bound = Math.pow(10, order_of_magnitude)
  const upper_bound = Math.pow(10, order_of_magnitude + 1)
  return { lower_bound, upper_bound }
}

const subjects = [
  food,
  general,
  geography,
  history,
  literature,
  music,
  sports,
  technology,
  tvMovies,
  animals,
  famousPeople,
  soccer,
  science,
  religion,
]

let count = 0
let stats = {}

let parsedSubjects = subjects.map((subject) => {
  let mapped = _.map(subject.questions, (question) => {
    const id = uuid.v5(question.question, uuid.v5.URL)
    const { lower_bound, upper_bound } = calculateBounds(question.question, question.answer)

    return {
      ...question,
      answer: Math.round(question.answer),
      lower_bound,
      upper_bound,
      id,
      category: subject.name.toLowerCase(),
    }
  })

  const uniqueQuestions = _.uniqBy(mapped, 'question')
  count += uniqueQuestions.length

  stats[subject.name] = uniqueQuestions.length

  return {
    name: subject.name,
    questions: uniqueQuestions,
  }
})

let dupes = []
const findQuestionsWithSameAnswer = (subjects) => {
  const qs = []

  subjects.forEach((subject) => {
    subject.questions.forEach((question) => {
      const q = question.question
      if (!qs.includes(q)) {
        qs.push(q)
      } else {
        dupes.push(q)
      }
    })
  })

  return dupes.sort()
}

const questionsWithSameAnswer = findQuestionsWithSameAnswer(subjects)

stats['total'] = count

fs.writeFile(
  'questionsWithSameAnswer.json',
  JSON.stringify(questionsWithSameAnswer, null, 2),
  (err) => {
    if (err) throw err
    console.log('Duplicates written to file')
  },
)

fs.writeFile('parsedSubjects.json', JSON.stringify(parsedSubjects, null, 2), (err) => {
  if (err) throw err
  console.log('Subjects written to file')
})

fs.writeFile('stats.json', JSON.stringify(stats, null, 2), (err) => {
  if (err) throw err
  console.log('Stats written to file')
})
