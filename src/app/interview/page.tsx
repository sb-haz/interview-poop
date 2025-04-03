'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mic, VideoOff, PhoneOff, Settings, Atom, Clock,
  PanelLeft, Repeat, Share, Download, Camera, Play, Pause
} from 'lucide-react'

const CONFIG = {
  QUESTION_TYPING_DURATION: 2000,
  ANSWER_TYPING_DURATION: 3000,
  PAUSE_AFTER_QUESTION: 2500,
  PAUSE_AFTER_ANSWER: 1000,
};

// Mock data
const mockQuestions = [
  {
    text: "Jakie są twoje słabe strony?",
    difficulty: 'medium' as const,
    category: 'techniczne' as const
  }
];

const mockAnswers = [
  "Jedną z moich słabszych stron jest zbytnie skupianie się na detalach",
];

// Text constants
const TEXT = {
  APP_NAME: "Interview Sensei",
  SESSION_DURATION: "30 minutes",
  
  // Section headers
  INTERVIEW_INFO: "Informajce",
  INTERVIEW_QUESTIONS: "Pytania",
  INTERVIEWER_QUESTION: "Pytanie rekrutera",
  USER_RESPONSE: "Twoja odpowiedź",
  
  // Labels
  LABEL_TYPE: "Typ:",
  LABEL_DURATION: "Czas trwania:",
  LABEL_ELAPSED: "Mineło:",
  LABEL_PROGRESS: "Postęp:",
  LABEL_INTERVIEWER: "Rekruter:",
  LABEL_QUESTION: "Pytanie",
  
  // Status indicators
  STATUS_LIVE: "Live",
  STATUS_PAUSED: "Pauza",
  STATUS_RECORDING: "Nagrywanie",
  STATUS_SPEAKING: "Mówienie",
  
  // Default messages
  DEFAULT_QUESTION: "Interviewer is about to ask a question...",
  DEFAULT_ANSWER: "Czekam na odpowiedź...",
  
  // Other text
  OF: "z",
};

// Constants
const INTERVIEWER_NAME = "AI Rekruter";
const INTERVIEWER_ROLE = "Marta";
const INTERVIEW_TYPE = "Techniczna";

const InterviewSession = () => {
  const [interviewerSpeaking, setInterviewerSpeaking] = useState<boolean>(false)
  const [userSpeaking, setUserSpeaking] = useState<boolean>(false)
  const [interviewerTranscript, setInterviewerTranscript] = useState<string>('')
  const [userTranscript, setUserTranscript] = useState<string>('')
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1000)
      }, 1000)
      
      timerRef.current = interval
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPaused])

  useEffect(() => {
    if (isPaused) return
    
    if (videoRef.current && userVideoRef.current) {
      videoRef.current.play().catch(e => console.error("Interviewer video play error:", e))
      userVideoRef.current.play().catch(e => console.error("User video play error:", e))
    }
    
    const timeoutIds: NodeJS.Timeout[] = []
    
    setInterviewerTranscript('')
    setUserTranscript('')
    setInterviewerSpeaking(true)
    setUserSpeaking(false)
    
    const question = mockQuestions[currentQuestionIndex].text
    const answer = mockAnswers[currentQuestionIndex]
    
    const questionLetters = question.split('')
    const letterTypingDelay = CONFIG.QUESTION_TYPING_DURATION / questionLetters.length
    
    questionLetters.forEach((letter, index) => {
      const id = setTimeout(() => {
        if (isPaused) return
        setInterviewerTranscript(prev => prev + letter)
      }, index * letterTypingDelay)
      timeoutIds.push(id)
    })
    
    const interviewerDoneId = setTimeout(() => {
      setInterviewerSpeaking(false)
    }, CONFIG.QUESTION_TYPING_DURATION)
    timeoutIds.push(interviewerDoneId)
    
    const pauseId = setTimeout(() => {
      setUserSpeaking(true)
      
      const answerLetters = answer.split('')
      const answerTypingDelay = CONFIG.ANSWER_TYPING_DURATION / answerLetters.length
      
      answerLetters.forEach((letter, index) => {
        const id = setTimeout(() => {
          if (isPaused) return
          setUserTranscript(prev => prev + letter)
        }, index * answerTypingDelay)
        timeoutIds.push(id)
      })
      
      const userDoneId = setTimeout(() => {
        setUserSpeaking(false)
      }, CONFIG.ANSWER_TYPING_DURATION)
      timeoutIds.push(userDoneId)
      
      const nextQuestionId = setTimeout(() => {
        setCurrentQuestionIndex(prev => (prev + 1) % mockQuestions.length)
      }, CONFIG.ANSWER_TYPING_DURATION + CONFIG.PAUSE_AFTER_ANSWER)
      timeoutIds.push(nextQuestionId)
      
    }, CONFIG.QUESTION_TYPING_DURATION + CONFIG.PAUSE_AFTER_QUESTION)
    timeoutIds.push(pauseId)
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [currentQuestionIndex, isPaused])

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const togglePause = (): void => setIsPaused(!isPaused)

  const colorScheme = {
    bg: "bg-gradient-to-br from-slate-100 to-slate-200",
    text: "text-slate-800",
    textSecondary: "text-slate-500",
    cardBg: "bg-white",
    border: "border-slate-200",
    accent: "from-blue-600 to-blue-500",
    buttonBg: "bg-white",
    buttonHover: "hover:bg-slate-50"
  };

  return (
    <div className={`h-screen ${colorScheme.bg} flex overflow-hidden font-sans`}>
      <div className={`${colorScheme.cardBg} shadow-xl transition-all duration-300 flex flex-col rounded-r-2xl m-2 w-80 ${colorScheme.border} border`}>
        <div className="p-5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`bg-gradient-to-r ${colorScheme.accent} rounded-lg p-1.5`}>
              <Atom className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-bold ${colorScheme.text}`}>{TEXT.APP_NAME}</span>
          </div>
          <button className={`${colorScheme.textSecondary} hover:${colorScheme.text} transition-colors rounded-full p-1.5 hover:bg-slate-100`}>
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className={`mx-3 p-5 bg-slate-50 rounded-xl shadow-sm mb-4 ${colorScheme.border} border`}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{TEXT.INTERVIEW_INFO}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorScheme.textSecondary}`}>{TEXT.LABEL_TYPE}</span>
                <span className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 rounded-full shadow-sm">{INTERVIEW_TYPE}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorScheme.textSecondary}`}>{TEXT.LABEL_DURATION}</span>
                <span className={`text-sm font-medium ${colorScheme.text}`}>{TEXT.SESSION_DURATION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorScheme.textSecondary}`}>{TEXT.LABEL_ELAPSED}</span>
                <span className={`text-sm font-medium ${colorScheme.text}`}>{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorScheme.textSecondary}`}>{TEXT.LABEL_PROGRESS}</span>
                <span className={`text-sm font-medium ${colorScheme.text}`}>{currentQuestionIndex + 1} {TEXT.OF} {mockQuestions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorScheme.textSecondary}`}>{TEXT.LABEL_INTERVIEWER}</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <span className={colorScheme.text}>{INTERVIEWER_NAME}</span>
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="mx-3 p-5 bg-slate-50 rounded-xl shadow-sm mb-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{TEXT.INTERVIEW_QUESTIONS}</h3>
            <div className="space-y-3">
              {mockQuestions.map((question, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${currentQuestionIndex === index ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'} border`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-400">{TEXT.LABEL_QUESTION} {index + 1}</span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      {question.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2">{question.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden mx-2 my-2">
        <div className={`${colorScheme.cardBg} shadow-sm py-2 px-4 mx-2 mt-2 rounded-xl flex items-center justify-between ${colorScheme.border} border`}>
          <div className="flex items-center gap-2">
            <h1 className={`text-sm font-semibold ${colorScheme.text}`}>{INTERVIEW_TYPE} Rozmowa</h1>
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
              <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
              <span>{TEXT.STATUS_LIVE}</span>
            </div>
            {isPaused && (
              <div className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full flex items-center gap-1">
                <Pause className="w-3 h-3" />
                <span>{TEXT.STATUS_PAUSED}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${colorScheme.textSecondary}`} />
              <span className={`text-xs font-medium ${colorScheme.textSecondary}`}>{formatTime(elapsedTime)} / 30:00</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="absolute inset-0 h-2 w-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className={`text-xs font-medium ${colorScheme.textSecondary}`}>{TEXT.STATUS_RECORDING}</span>
            </div>

            <div className="flex items-center gap-1">
              <button className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}>
                <Share className="w-3.5 h-3.5" />
              </button>
              <button className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2 flex flex-col h-full">
          <div className="h-full w-full flex flex-col">
            <div className={`${colorScheme.cardBg} rounded-xl shadow-lg overflow-hidden ${colorScheme.border} border transition-all duration-300 hover:shadow-xl flex-1`}>
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 flex flex-col h-full">
                  <div className="p-3 flex-1 w-full bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
                    <div className="relative aspect-square w-full max-w-xs max-h-full overflow-hidden rounded-xl shadow-md transition-all duration-300">
                      <video
                        ref={videoRef}
                        src="f1.mp4"
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        loop
                      />
                      <div className="absolute bottom-2 left-2">
                        <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-white font-medium">{INTERVIEWER_NAME}</span>
                            <span className="text-xs text-gray-300">{INTERVIEWER_ROLE}</span>
                          </div>
                        </div>
                      </div>
                      
                      {interviewerSpeaking && (
                        <div className="absolute top-2 right-2">
                          <div className="px-2 py-1 rounded-full bg-green-500/70 backdrop-blur-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                              <span className="text-xs text-white font-medium">{TEXT.STATUS_SPEAKING}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-3 pb-3 h-40">
                    <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl w-full h-full overflow-y-auto hide-scrollbar border-blue-50 border shadow-sm">
                      <h3 className="font-medium text-slate-400 text-xs mb-1 uppercase tracking-wide">{TEXT.INTERVIEWER_QUESTION}</h3>
                      <p className="text-slate-800 font-medium text-sm leading-relaxed">
                        {interviewerTranscript || TEXT.DEFAULT_QUESTION}
                      </p>

                      {interviewerTranscript && (
                        <div className="mt-2 flex items-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                            {mockQuestions[currentQuestionIndex % mockQuestions.length].category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col h-full">
                  <div className="p-3 flex-1 w-full bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
                    <div className="relative aspect-square w-full max-w-xs max-h-full overflow-hidden rounded-xl shadow-md transition-all duration-300">
                      <video
                        ref={userVideoRef}
                        src="int2.mp4"
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        loop
                      />
                      <div className="absolute bottom-2 left-2">
                        <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-medium">Ty</span>
                          </div>
                        </div>
                      </div>
                      
                      {userSpeaking && (
                        <div className="absolute top-2 right-2">
                          <div className="px-2 py-1 rounded-full bg-green-500/70 backdrop-blur-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                              <span className="text-xs text-white font-medium">{TEXT.STATUS_SPEAKING}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-3 pb-3 h-40">
                    <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl w-full h-full overflow-y-auto hide-scrollbar border-blue-50 border shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-slate-400 text-xs mb-1 uppercase tracking-wide">{TEXT.USER_RESPONSE}</h3>
                        {userSpeaking && (
                          <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                            <Mic className="w-2.5 h-2.5 text-green-600" />
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-600">{TEXT.STATUS_SPEAKING}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {userTranscript || (
                          <span className="text-slate-400 italic">{TEXT.DEFAULT_ANSWER}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${colorScheme.cardBg} shadow-lg py-3 px-4 mx-2 mb-1 rounded-xl flex justify-center ${colorScheme.border} border`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={togglePause}
              className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              {isPaused ? (
                <Play className={`w-4 h-4 ${colorScheme.textSecondary}`} />
              ) : (
                <Pause className={`w-4 h-4 ${colorScheme.textSecondary}`} />
              )}
            </button>

            <button className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Repeat className={`w-4 h-4 ${colorScheme.textSecondary}`} />
            </button>

            <button className={`w-10 h-10 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Mic className="w-4 h-4" />
            </button>

            <button className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white flex items-center justify-center shadow-md hover:shadow-lg border border-red-400">
              <PhoneOff className="w-5 h-5" />
            </button>

            <button className={`w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 border-red-400 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow border`}>
              <VideoOff className="w-4 h-4" />
            </button>

            <button className={`w-8 h-8 rounded-full bg-red-50 text-red-600 border-red-200 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow border`}>
              <Camera className="w-4 h-4" />
            </button>

            <button className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Settings className={`w-4 h-4 ${colorScheme.textSecondary}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewSession