import type React from 'preact/compat'
import { useState, useEffect } from 'preact/hooks'

interface ChallengeProps {
  id: string // 唯一标识符，用于存储答题状态
  type: 'single' | 'multiple' | 'fill' // 单选 | 多选 | 填空
  question: React.ReactNode
  content?: React.ReactNode
  options?: {
    key: string
    value: React.ReactNode
  }[]
  answer: string | string[] // 支持单个答案或多个答案
}

interface AnswerState {
  lastWrongTime?: number
  isCompleted: boolean
  userAnswer?: string | string[]
}

export default function Challenge(props: ChallengeProps) {
  const { id, type, question, content, options, answer } = props
  const [userAnswer, setUserAnswer] = useState<string | string[]>('')
  const [answerState, setAnswerState] = useState<AnswerState>({
    isCompleted: false,
  })
  const [showResult, setShowResult] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)

  // 从localStorage加载答题状态
  useEffect(() => {
    const saved = localStorage.getItem(`challenge_${id}`)
    if (saved) {
      const state: AnswerState = JSON.parse(saved)
      setAnswerState(state)

      // 检查是否在24小时锁定期内
      if (state.lastWrongTime) {
        const now = Date.now()
        const lockDuration = 24 * 60 * 60 * 1000 // 24小时
        const timePassed = now - state.lastWrongTime

        if (timePassed < lockDuration) {
          setIsLocked(true)
          setLockTimeRemaining(lockDuration - timePassed)
        }
      }

      if (state.userAnswer) {
        setUserAnswer(state.userAnswer)
        setShowResult(true)
      }
    }

    // 设置多选题的初始值
    if (type === 'multiple') {
      setUserAnswer([])
    }
  }, [id, type])

  // 锁定倒计时
  useEffect(() => {
    if (isLocked && lockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1000) {
            setIsLocked(false)
            return 0
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(timer as any)
    }
  }, [isLocked, lockTimeRemaining])

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}小时${minutes}分钟`
  }

  const saveAnswerState = (state: AnswerState) => {
    localStorage.setItem(`challenge_${id}`, JSON.stringify(state))
    setAnswerState(state)
  }

  const handleSingleChoice = (value: string) => {
    if (isLocked || answerState.isCompleted) return
    setUserAnswer(value)
  }

  const handleMultipleChoice = (value: string) => {
    if (isLocked || answerState.isCompleted) return
    const current = userAnswer as string[]
    if (current.includes(value)) {
      setUserAnswer(current.filter((item) => item !== value))
    } else {
      setUserAnswer([...current, value])
    }
  }

  const handleFillAnswer = (value: string) => {
    if (isLocked || answerState.isCompleted) return
    setUserAnswer(value)
  }

  const checkAnswer = () => {
    if (isLocked) return

    let isCorrect = false

    if (type === 'multiple') {
      const userArr = (userAnswer as string[]).sort()
      const correctArr = (Array.isArray(answer) ? answer : [answer]).sort()
      isCorrect =
        userArr.length === correctArr.length &&
        userArr.every((val, index) => val === correctArr[index])
    } else {
      isCorrect = userAnswer === answer
    }

    const newState: AnswerState = {
      isCompleted: isCorrect,
      userAnswer,
      lastWrongTime: isCorrect ? undefined : Date.now(),
    }

    if (!isCorrect) {
      setIsLocked(true)
      setLockTimeRemaining(24 * 60 * 60 * 1000)
    }

    saveAnswerState(newState)
    setShowResult(true)
  }

  const resetChallenge = () => {
    localStorage.removeItem(`challenge_${id}`)
    setUserAnswer(type === 'multiple' ? [] : '')
    setAnswerState({ isCompleted: false })
    setShowResult(false)
    setIsLocked(false)
    setLockTimeRemaining(0)
  }

  const isAnswerEmpty =
    type === 'multiple' ? (userAnswer as string[]).length === 0 : !userAnswer

  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    return labels[index]
  }

  return (
    <article className='not-content my-4 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-6 flex flex-col gap-4'>
      {/* 题目标题 */}
      <div className='flex items-start gap-3'>
        <div className='flex-none w-8 h-8 bg-accent-100 dark:bg-accent-900 border border-accent-300 dark:border-accent-700 flex items-center justify-center'>
          <span className='text-accent-600 dark:text-accent-400 font-semibold text-sm'>
            {type === 'single' ? '单' : type === 'multiple' ? '多' : '填'}
          </span>
        </div>
        <h3 className='font-semibold text-lg text-gray-900 dark:text-gray-100 m-0'>
          {question}
        </h3>
      </div>

      {/* 题目内容 */}
      {content && (
        <div className='text-gray-700 dark:text-gray-300 text-sm'>
          {content}
        </div>
      )}

      {/* 锁定状态提示 */}
      {isLocked && (
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4'>
          <p className='text-red-700 dark:text-red-400 text-sm mb-2'>
            ⏰ {formatTimeRemaining(lockTimeRemaining)} 后可重新作答
          </p>
        </div>
      )}

      {/* 答题区域 */}
      <div className='space-y-3'>
        {/* 单选题 */}
        {type === 'single' && options && (
          <div className='space-y-2'>
            {options.map((option, index) => {
              const isCorrect = answer === option.key
              const isUserChoice = userAnswer === option.key
              const isWrong = showResult && isUserChoice && !isCorrect

              return (
                <label
                  key={option.key}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    // 显示结果时的样式
                    showResult && isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : showResult && isWrong
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : // 正常状态样式
                      userAnswer === option.key
                      ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-300 dark:border-accent-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${
                    answerState.isCompleted || isLocked
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  <input
                    type='radio'
                    name={`challenge_${id}`}
                    value={option.key}
                    checked={userAnswer === option.key}
                    onChange={(e) => handleSingleChoice(e.currentTarget.value)}
                    disabled={answerState.isCompleted || isLocked}
                    className='text-accent-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300 text-sm flex-1'>
                    {getOptionLabel(index)}. {option.value}
                  </span>
                  {/* 答题后的标注 */}
                  {showResult && isCorrect && (
                    <span className='text-emerald-600 dark:text-emerald-400 text-sm font-medium'>
                      ✓ 正确
                    </span>
                  )}
                  {showResult && isWrong && (
                    <span className='text-red-600 dark:text-red-400 text-sm font-medium'>
                      ✗ 错误
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        {/* 多选题 */}
        {type === 'multiple' && options && (
          <div className='space-y-2'>
            {options.map((option, index) => {
              const correctAnswers = Array.isArray(answer) ? answer : [answer]
              const isCorrect = correctAnswers.includes(option.key)
              const isUserChoice = (userAnswer as string[]).includes(option.key)
              const isWrong = showResult && isUserChoice && !isCorrect
              const isMissed = showResult && !isUserChoice && isCorrect

              return (
                <label
                  key={option.key}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                    // 显示结果时的样式
                    showResult && isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : showResult && isWrong
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : // 正常状态样式
                      (userAnswer as string[]).includes(option.key)
                      ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-300 dark:border-accent-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${
                    answerState.isCompleted || isLocked
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  <input
                    type='checkbox'
                    value={option.key}
                    checked={(userAnswer as string[]).includes(option.key)}
                    onChange={(e) =>
                      handleMultipleChoice(e.currentTarget.value)
                    }
                    disabled={answerState.isCompleted || isLocked}
                    className='text-accent-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300 text-sm flex-1'>
                    {getOptionLabel(index)}. {option.value}
                  </span>
                  {/* 答题后的标注 */}
                  {showResult && isCorrect && isUserChoice && (
                    <span className='text-emerald-600 dark:text-emerald-400 text-sm font-medium'>
                      ✓ 正确
                    </span>
                  )}
                  {showResult && isWrong && (
                    <span className='text-red-600 dark:text-red-400 text-sm font-medium'>
                      ✗ 错误
                    </span>
                  )}
                  {showResult && isMissed && (
                    <span className='text-orange-600 dark:text-orange-400 text-sm font-medium'>
                      ✓ 应选
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        {/* 填空题 */}
        {type === 'fill' && (
          <input
            type='text'
            value={userAnswer as string}
            onChange={(e) => handleFillAnswer(e.currentTarget.value)}
            disabled={answerState.isCompleted || isLocked}
            placeholder='请输入答案...'
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-accent-500 disabled:opacity-60 disabled:cursor-not-allowed'
          />
        )}
      </div>

      {/* 结果显示 */}
      {showResult && (
        <div
          className={`p-4 border ${
            answerState.isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              answerState.isCompleted
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {answerState.isCompleted ? '✅ 回答正确！' : '❌ 回答错误'}
          </p>
          {!answerState.isCompleted && (
            <p className='text-red-600 dark:text-red-400 text-xs mt-1'>
              正确答案：{Array.isArray(answer) ? answer.join(', ') : answer}
            </p>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className='flex gap-3 pt-2'>
        {!answerState.isCompleted && !isLocked && (
          <button
            onClick={checkAnswer}
            disabled={isAnswerEmpty}
            className='px-4 py-2 bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors'
          >
            提交答案
          </button>
        )}

        {!answerState.isCompleted && showResult && !isLocked && (
          <button
            onClick={resetChallenge}
            className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium transition-colors'
          >
            重新答题
          </button>
        )}
      </div>
    </article>
  )
}
