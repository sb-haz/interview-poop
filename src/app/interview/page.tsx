'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Atom, Clock,
  PanelLeft, Repeat, Share, Download, Camera, Play, Pause
} from 'lucide-react'
import type { NextPage } from 'next'

// Add custom styles for hiding scrollbar
const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Configuration variables - CONTROL ALL TIMING FROM HERE
const CONFIG = {
  // Video durations
  INTERVIEWER_VIDEO_DURATION: 6800,      // How long the interviewer video plays in ms
  INTERVIEWEE_VIDEO_DURATION: 10000,     // How long the interviewee video plays in ms

  // Text typing speeds
  QUESTION_TYPING_DURATION: 2000,        // Total ms to type out the entire question
  ANSWER_TYPING_DURATION: 3000,          // Total ms to type out the entire answer

  // Pause timings
  PAUSE_AFTER_QUESTION: 2500,            // Pause after question before answer starts (1 second)
  PAUSE_AFTER_ANSWER: 1000,              // Pause after answer before next question cycle

  // Advanced settings
  AUTO_RECORD: true,                     // Auto-record the session
  MAX_INTERVIEW_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
};

// Enhanced mock questions with difficulty levels and categories
const mockQuestions: {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'technical' | 'behavioral' | 'situational';
}[] = [
    {
      text: "Jakie są twoje słabe strony?",
      difficulty: 'medium',
      category: 'technical'
    }
  ];

// Fixed interview responses
const mockAnswers = [
  "Jedną z moich słabszych stron jest zbytnie skupianie się na detalach",
];

const InterviewSession: NextPage = () => {
  // Core state variables
  const [interviewerSpeaking, setInterviewerSpeaking] = useState<boolean>(false)
  const [userSpeaking, setUserSpeaking] = useState<boolean>(false)
  const [interviewerTranscript, setInterviewerTranscript] = useState<string>('')
  const [userTranscript, setUserTranscript] = useState<string>('')
  const [interviewerName] = useState<string>("AI Interviewer")
  const [interviewerRole] = useState<string>("Senior Tech Lead")
  const [micEnabled, setMicEnabled] = useState<boolean>(true)
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false)
  const [callActive, setCallActive] = useState<boolean>(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [interviewType] = useState<string>("Technical")
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Minimal state variables
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [totalQuestions] = useState<number>(mockQuestions.length)
  const [isRecording, setIsRecording] = useState<boolean>(CONFIG.AUTO_RECORD)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // Video and timer references
  const videoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize timer for session duration
  useEffect(() => {
    if (callActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1000)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [callActive, isPaused])

  // Set up continuous video playback and text typing effects
  useEffect(() => {
    if (!callActive || isPaused) return
    
    // Ensure videos play continuously
    if (videoRef.current && userVideoRef.current) {
      videoRef.current.play().catch(e => console.error("Interviewer video play error:", e))
      userVideoRef.current.play().catch(e => console.error("User video play error:", e))
    }
    
    const timeoutIds: NodeJS.Timeout[] = []
    
    // Reset transcripts and speaking states
    setInterviewerTranscript('')
    setUserTranscript('')
    setInterviewerSpeaking(true) // Initially speaking
    setUserSpeaking(false)
    
    // Get current question and answer
    const question = mockQuestions[currentQuestionIndex].text
    const answer = mockAnswers[currentQuestionIndex]
    
    // Type out question letter by letter
    const questionLetters = question.split('')
    const letterTypingDelay = CONFIG.QUESTION_TYPING_DURATION / questionLetters.length
    
    questionLetters.forEach((letter, index) => {
      const id = setTimeout(() => {
        if (!callActive || isPaused) return
        setInterviewerTranscript(prev => prev + letter)
      }, index * letterTypingDelay)
      timeoutIds.push(id)
    })
    
    // After question is typed, stop interviewer speaking
    const interviewerDoneId = setTimeout(() => {
      setInterviewerSpeaking(false)
    }, CONFIG.QUESTION_TYPING_DURATION)
    timeoutIds.push(interviewerDoneId)
    
    // After question is typed, wait for pause and then type answer
    const pauseId = setTimeout(() => {
      // Start user speaking
      setUserSpeaking(true)
      
      // Type out answer letter by letter
      const answerLetters = answer.split('')
      const answerTypingDelay = CONFIG.ANSWER_TYPING_DURATION / answerLetters.length
      
      answerLetters.forEach((letter, index) => {
        const id = setTimeout(() => {
          if (!callActive || isPaused) return
          setUserTranscript(prev => prev + letter)
        }, index * answerTypingDelay)
        timeoutIds.push(id)
      })
      
      // After answer is typed, stop user speaking
      const userDoneId = setTimeout(() => {
        setUserSpeaking(false)
      }, CONFIG.ANSWER_TYPING_DURATION)
      timeoutIds.push(userDoneId)
      
      // After answer is typed, move to next question
      const nextQuestionId = setTimeout(() => {
        setCurrentQuestionIndex(prev => (prev + 1) % mockQuestions.length)
      }, CONFIG.ANSWER_TYPING_DURATION + CONFIG.PAUSE_AFTER_ANSWER)
      timeoutIds.push(nextQuestionId)
      
    }, CONFIG.QUESTION_TYPING_DURATION + CONFIG.PAUSE_AFTER_QUESTION)
    timeoutIds.push(pauseId)
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [currentQuestionIndex, callActive, isPaused])

  // Format time for display
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // UI Control Functions
  const endCall = () => {
    setCallActive(false)
  }

  const toggleMic = () => setMicEnabled(!micEnabled)
  const toggleVideo = () => setVideoEnabled(!videoEnabled)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleRecording = () => setIsRecording(!isRecording)
  const togglePause = () => setIsPaused(!isPaused)

  const repeatQuestion = () => {
    // Restart the current question
    setCurrentQuestionIndex(prev => prev)
  }

  // Define the color scheme
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
      {/* Add style tag for custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />

      {/* Sidebar */}
      <div
        className={`${colorScheme.cardBg} shadow-xl transition-all duration-300 flex flex-col rounded-r-2xl m-2 ${sidebarCollapsed ? 'w-16' : 'w-80'
          } ${colorScheme.border} border`}
      >
        {/* Logo */}
        <div className="p-5 mb-3 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className={`bg-gradient-to-r ${colorScheme.accent} rounded-lg p-1.5`}>
                <Atom className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold ${colorScheme.text}`}>Interview Sensei</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className={`bg-gradient-to-r ${colorScheme.accent} rounded-lg p-1.5 mx-auto`}>
              <Atom className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`${colorScheme.textSecondary} hover:${colorScheme.text} transition-colors rounded-full p-1.5 hover:bg-slate-100`}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Interview Info */}
          <div className={`mx-3 p-5 bg-slate-50 rounded-xl shadow-sm mb-4 ${colorScheme.border} border`}>
            {!sidebarCollapsed && <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Interview Info</h3>}

            {!sidebarCollapsed && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colorScheme.textSecondary}`}>Type:</span>
                  <span className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 rounded-full shadow-sm">{interviewType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colorScheme.textSecondary}`}>Duration:</span>
                  <span className={`text-sm font-medium ${colorScheme.text}`}>30 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colorScheme.textSecondary}`}>Elapsed:</span>
                  <span className={`text-sm font-medium ${colorScheme.text}`}>{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colorScheme.textSecondary}`}>Progress:</span>
                  <span className={`text-sm font-medium ${colorScheme.text}`}>{currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colorScheme.textSecondary}`}>Interviewer:</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <span className={colorScheme.text}>{interviewerName}</span>
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Question List (simple version) */}
          {!sidebarCollapsed && (
            <div className="mx-3 p-5 bg-slate-50 rounded-xl shadow-sm mb-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Interview Questions</h3>
              <div className="space-y-3">
                {mockQuestions.map((question, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${currentQuestionIndex === index ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'} border`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-400">Question {index + 1}</span>
                      <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        {question.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2">{question.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden mx-2 my-2">
        {/* Header */}
        <div className={`${colorScheme.cardBg} shadow-sm py-2 px-4 mx-2 mt-2 rounded-xl flex items-center justify-between ${colorScheme.border} border`}>
          <div className="flex items-center gap-2">
            <h1 className={`text-sm font-semibold ${colorScheme.text}`}>{interviewType} Interview</h1>
            <div className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
              <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            {isPaused && (
              <div className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-medium rounded-full flex items-center gap-1">
                <Pause className="w-3 h-3" />
                <span>Paused</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${colorScheme.textSecondary}`} />
              <span className={`text-xs font-medium ${colorScheme.textSecondary}`}>{formatTime(elapsedTime)} / 30:00</span>
            </div>

            <div className="flex items-center gap-1.5">
              {isRecording ? (
                <>
                  <div className="relative">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <div className="absolute inset-0 h-2 w-2 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className={`text-xs font-medium ${colorScheme.textSecondary}`}>Recording</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                  <span className={`text-xs font-medium ${colorScheme.textSecondary}`}>Not Recording</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}
              >
                <Share className="w-3.5 h-3.5" />
              </button>

              <button
                className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interview Area */}
<div className="flex-1 overflow-hidden p-2 flex flex-col h-full">
  <div className="h-full w-full flex flex-col">
    <div className={`${colorScheme.cardBg} rounded-xl shadow-lg overflow-hidden ${colorScheme.border} border transition-all duration-300 hover:shadow-xl flex-1`}>
      <div className="flex flex-col md:flex-row h-full">
        {/* Left column: Interviewer Video and Question */}
        <div className="w-full md:w-1/2 flex flex-col h-full">
          {/* Interviewer Video Card - Square */}
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
                    <span className="text-xs text-white font-medium">AI Interviewer</span>
                    <span className="text-xs text-gray-300">{interviewerRole}</span>
                  </div>
                </div>
              </div>
              
              {interviewerSpeaking && (
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 rounded-full bg-green-500/70 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-medium">Speaking</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interviewer's Question - Fixed height with overflow */}
          <div className="px-3 pb-3 h-40">
            <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl w-full h-full overflow-y-auto hide-scrollbar border-blue-50 border shadow-sm">
              <h3 className="font-medium text-slate-400 text-xs mb-1 uppercase tracking-wide">Interviewer&apos;s Question</h3>
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                {interviewerTranscript || "Interviewer is about to ask a question..."}
              </p>

              {/* Question category tag */}
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

        {/* Right column: User Video and Answer */}
        <div className="w-full md:w-1/2 flex flex-col h-full">
          {/* User Video Card - Square */}
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
                    <span className="text-xs text-white font-medium">You</span>
                  </div>
                </div>
              </div>
              
              {userSpeaking && (
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 rounded-full bg-green-500/70 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs text-white font-medium">Speaking</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Answer - Fixed height with overflow */}
          <div className="px-3 pb-3 h-40">
            <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl w-full h-full overflow-y-auto hide-scrollbar border-blue-50 border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-slate-400 text-xs mb-1 uppercase tracking-wide">Your Response</h3>
                {userSpeaking && (
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                    <Mic className="w-2.5 h-2.5 text-green-600" />
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-600">Speaking</span>
                  </div>
                )}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {userTranscript || (
                  <span className="text-slate-400 italic">Waiting for your response...</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Call Controls */}
        <div className={`${colorScheme.cardBg} shadow-lg py-3 px-4 mx-2 mb-1 rounded-xl flex justify-center ${colorScheme.border} border`}>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePause}
              aria-label={isPaused ? "Resume interview" : "Pause interview"}
              className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              {isPaused ? (
                <Play className={`w-4 h-4 ${colorScheme.textSecondary}`} />
              ) : (
                <Pause className={`w-4 h-4 ${colorScheme.textSecondary}`} />
              )}
            </button>

            <button
              onClick={repeatQuestion}
              aria-label="Repeat question"
              className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Repeat className={`w-4 h-4 ${colorScheme.textSecondary}`} />
            </button>

            <button
              onClick={toggleMic}
              aria-label={micEnabled ? "Disable microphone" : "Enable microphone"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow border ${micEnabled ? `${colorScheme.buttonBg} ${colorScheme.buttonHover} ${colorScheme.textSecondary} ${colorScheme.border}` : 'bg-red-500 text-white hover:bg-red-600 border-red-400'
                }`}>
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={endCall}
              aria-label="End call"
              className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white flex items-center justify-center shadow-md hover:shadow-lg border border-red-400">
              <PhoneOff className="w-5 h-5" />
            </button>

            <button
              onClick={toggleVideo}
              aria-label={videoEnabled ? "Disable video" : "Enable video"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow border ${videoEnabled ? `${colorScheme.buttonBg} ${colorScheme.buttonHover} ${colorScheme.textSecondary} ${colorScheme.border}` : 'bg-red-500 text-white hover:bg-red-600 border-red-400'
                }`}>
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleRecording}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              className={`w-8 h-8 rounded-full ${isRecording ? 'bg-red-50 text-red-600 border-red-200' : `${colorScheme.buttonBg} ${colorScheme.textSecondary}`} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow border ${isRecording ? 'border-red-200' : colorScheme.border}`}>
              <Camera className="w-4 h-4" />
            </button>

            <button
              aria-label="Settings"
              className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Settings className={`w-4 h-4 ${colorScheme.textSecondary}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewSession