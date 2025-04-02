'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Atom, Clock,
  PanelLeft, Eye, EyeOff, Repeat, Share, BarChart2, FilePlus,
  Download, Camera, MessageSquare, Users, Activity, AlertOctagon,
  FileText, ThumbsUp, ThumbsDown, Save, Moon, Play, Pause,
  Sun
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

  .glass-effect {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .shimmer {
    background: linear-gradient(90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.2) 50%, 
      rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {background-position: -200% 0}
    100% {background-position: 200% 0}
  }
`;

// Configuration variables - CONTROL ALL TIMING FROM HERE
const CONFIG = {
  // Video durations
  INTERVIEWER_VIDEO_DURATION: 6800,      // How long the interviewer video plays in ms 6800
  INTERVIEWEE_VIDEO_DURATION: 10000,     // How long the interviewee video plays in ms

  // Text typing speeds
  QUESTION_TYPING_DURATION: 7300,        // Total ms to type out the entire question
  ANSWER_TYPING_DURATION: 9800,          // Total ms to type out the entire answer
  ANSWER_TYPING_SPEED: 30,               // Characters per second for answer typing
  ANSWER_TYPING_MULTIPLIER: 30,          // Speed multiplier for answer typing (higher = slower)

  // Pause timings
  PAUSE_AFTER_QUESTION: 1000,            // Pause after question before answer starts (1 second)
  PAUSE_AFTER_ANSWER: 4000,              // Pause after answer before next question cycle

  // Hint timing
  HINTS_TYPING_CHAR_DELAY: 5,            // Delay per character when typing hints (ms)
  HINTS_START_DELAY: 8100,               // Delay before hints start typing (ms)

  // Advanced settings
  AUTO_RECORD: true,                     // Auto-record the session
  SPEECH_ANALYSIS: true,                 // Enable speech analysis
  MAX_INTERVIEW_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  SENTIMENT_ANALYSIS: true,              // Enable sentiment analysis
  TECHNICAL_VOCABULARY_CHECK: true,      // Check for technical vocabulary
  NEURAL_FEEDBACK: true                  // Enable neural feedback
};

// Enhanced mock questions with difficulty levels and categories
const mockQuestions: {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'technical' | 'behavioral' | 'situational';
  sentimentTarget: 'positive' | 'neutral' | 'confident';
  expectedDuration: number;
}[] = [
    {
      text: "Your CV mentions you led a migration to AWS. Can you tell us more about that experience and the challenges you faced?",
      difficulty: 'medium',
      category: 'technical',
      sentimentTarget: 'confident',
      expectedDuration: 120
    },
    {
      text: "Describe a time when you had to optimize a slow-performing application. What approach did you take?",
      difficulty: 'hard',
      category: 'technical',
      sentimentTarget: 'confident',
      expectedDuration: 150
    },
    {
      text: "How would you design a scalable microservice architecture for a high-traffic e-commerce platform?",
      difficulty: 'hard',
      category: 'technical',
      sentimentTarget: 'confident',
      expectedDuration: 180
    }
  ];

const questionHints = [
  {
    tips: [
      "Talk about why your team decided to migrate to AWS",
      "Mention which AWS services you used and why",
      "Share one key challenge and how you solved it",
      "Discuss the migration strategy (big bang vs. incremental)",
      "Mention any monitoring or rollback plans you implemented"
    ],
    keyPhrases: ["containerization", "microservices", "CI/CD", "infrastructure as code", "cost optimization"],
    avoidPhrases: ["we had problems", "it was difficult", "I'm not sure"],
    bodyLanguageTips: ["Maintain eye contact", "Use hand gestures to emphasize points", "Sit upright to project confidence"]
  },
  {
    tips: [
      "Start by describing the performance issue and its impact",
      "Explain your process for identifying the root cause",
      "Detail the specific optimizations you implemented",
      "Share before/after metrics to demonstrate improvement",
      "Mention any lessons learned or best practices adopted"
    ],
    keyPhrases: ["profiling", "benchmarking", "caching", "indexing", "query optimization"],
    avoidPhrases: ["slow code", "it just worked", "trial and error"],
    bodyLanguageTips: ["Use technical hand gestures", "Pause thoughtfully before answering", "Show enthusiasm when discussing results"]
  }
];

// Sample performance metrics
const initialPerformanceMetrics = {
  confidence: 72,
  clarity: 85,
  technicalAccuracy: 78,
  relevance: 90,
  completeness: 82,
  pace: 75,
  bodyLanguage: 80,
  eyeContact: 72
};

// Sample feedback comments for different questions
const feedbackComments = [
  [
    "Good technical depth on AWS services",
    "Could expand more on the challenges faced",
    "Excellent explanation of the migration strategy",
    "Try to quantify the outcomes more specifically"
  ],
  [
    "Strong problem-solving approach demonstrated",
    "Good use of technical terms",
    "Consider adding more context about the application",
    "Well-structured answer with clear beginning and conclusion"
  ]
];

// Interview session personas
const interviewerPersonas = [
  { id: 'technical', name: "Dr. Alex Chen", role: "Senior Tech Lead", style: "Technical depth", videoSrc: "int.mp4" },
  { id: 'hr', name: "Sarah Johnson", role: "HR Director", style: "Behavioral focus", videoSrc: "int_hr.mp4" },
  { id: 'manager', name: "Michael Rodriguez", role: "Engineering Manager", style: "Leadership assessment", videoSrc: "int_manager.mp4" }
];

// Interview session types
const interviewTypes = [
  { id: 'technical', name: "Technical", description: "Focus on technical skills and problem-solving" },
  { id: 'behavioral', name: "Behavioral", description: "Assess past experiences and soft skills" },
  { id: 'system_design', name: "System Design", description: "Evaluate architecture and scaling knowledge" },
  { id: 'cultural', name: "Cultural Fit", description: "Determine alignment with company values" }
];

type PerformanceMetrics = {
  confidence: number;
  clarity: number;
  technicalAccuracy: number;
  relevance: number;
  completeness: number;
  pace: number;
  bodyLanguage: number;
  eyeContact: number;
};

const InterviewSession: NextPage = () => {
  // Core state variables
  const [interviewerSpeaking, setInterviewerSpeaking] = useState<boolean>(false)
  const [userSpeaking, setUserSpeaking] = useState<boolean>(false)
  const [interviewerTranscript, setInterviewerTranscript] = useState<string>('')
  const [userTranscript, setUserTranscript] = useState<string>('')
  const [interviewerName, setInterviewerName] = useState<string>("AI Interviewer")
  const [interviewerRole, setInterviewerRole] = useState<string>("Senior Tech Lead")
  const [micEnabled, setMicEnabled] = useState<boolean>(true)
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false)
  const [callActive, setCallActive] = useState<boolean>(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [interviewType, setInterviewType] = useState<string>("Technical")
  const [showHints, setShowHints] = useState<boolean>(true)
  const [isTypingHints, setIsTypingHints] = useState<boolean>(false)
  // No audio state needed since videos play without audio
  const [currentHints, setCurrentHints] = useState({
    tips: [""],
    keyPhrases: [""],
    avoidPhrases: [""],
    bodyLanguageTips: [""]
  })

  // Enhanced state variables
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [totalQuestions] = useState<number>(mockQuestions.length)
  const [isRecording, setIsRecording] = useState<boolean>(CONFIG.AUTO_RECORD)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(initialPerformanceMetrics)
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false)
  const [showNotes, setShowNotes] = useState<boolean>(false)
  const [interviewNotes, setInterviewNotes] = useState<string>("")
  const [feedbackVisible, setFeedbackVisible] = useState<boolean>(false)
  const [currentFeedback, setCurrentFeedback] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [confidenceScore, setConfidenceScore] = useState<number>(0)
  const [answerCompleteness, setAnswerCompleteness] = useState<number>(0)
  const [technicalAccuracy, setTechnicalAccuracy] = useState<number>(0)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false)

  // Video and audio references
  const videoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

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

  // Format time for display
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // No audio-related click handlers needed since videos play automatically without audio

  // Simulate sentiment analysis during answer
  useEffect(() => {
    if (userSpeaking && userTranscript.length > 0) {
      // Simulated real-time metrics updates
      const interval = setInterval(() => {
        setConfidenceScore(prev => Math.min(100, prev + Math.random() * 5 - 2))
        setAnswerCompleteness(prev => Math.min(100, prev + Math.random() * 3))
        setTechnicalAccuracy(prev => Math.min(100, prev + Math.random() * 2 - 1))

        // Update overall metrics
        setPerformanceMetrics(prev => ({
          ...prev,
          confidence: Math.min(100, prev.confidence + Math.random() * 0.5 - 0.2),
          clarity: Math.min(100, prev.clarity + Math.random() * 0.4 - 0.1),
          technicalAccuracy: Math.min(100, prev.technicalAccuracy + Math.random() * 0.6 - 0.3),
          completeness: Math.min(100, Math.max(50, prev.completeness + Math.random() * 0.5 - 0.1)),
        }))
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [userSpeaking, userTranscript])

  // Feedback system that triggers after answer
  useEffect(() => {
    if (!userSpeaking && userTranscript.length > 20 && !feedbackVisible) {
      const timer = setTimeout(() => {
        setCurrentFeedback(feedbackComments[currentQuestionIndex % feedbackComments.length])
        setFeedbackVisible(true)
        setHasNewNotifications(true)

        // Show alert with positive reinforcement
        setAlertMessage("Answer analysis complete. Overall: Strong response!")
        setTimeout(() => setAlertMessage(null), 5000)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [userSpeaking, userTranscript, currentQuestionIndex, feedbackVisible])

  // Simulate interview flow
  useEffect(() => {
    if (!callActive || isPaused) return

    const timeoutIds: NodeJS.Timeout[] = []

    // Reset for new question cycle
    const askQuestion = async () => {
      // Reset states
      setInterviewerTranscript('')
      setUserTranscript('')
      setIsTypingHints(false)
      setFeedbackVisible(false)
      setConfidenceScore(0)
      setAnswerCompleteness(0)
      setTechnicalAccuracy(0)

      // Interviewer asks question
      setInterviewerSpeaking(true)
      const question = mockQuestions[currentQuestionIndex % mockQuestions.length].text

      // Play interviewer video
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }

      // Type out question word by word
      const words = question.split(' ')
      const wordTypingDelay = CONFIG.QUESTION_TYPING_DURATION / words.length
      for (let i = 0; i <= words.length; i++) {
        if (!callActive || isPaused) break
        const id = setTimeout(() => {
          setInterviewerTranscript(words.slice(0, i).join(' '))
        }, i * wordTypingDelay)
        timeoutIds.push(id)
      }

      // Interviewer finishes speaking after typing is complete
      const speakingEndId = setTimeout(() => {
        setInterviewerSpeaking(false)

        // Pause interviewer video
        if (videoRef.current) {
          videoRef.current.pause()
        }

        // Start typing hints
        setIsTypingHints(true)

        // Reset hints
        setCurrentHints({
          tips: [""],
          keyPhrases: [""],
          avoidPhrases: [""],
          bodyLanguageTips: [""]
        })

        // Schedule interviewee to start speaking after PAUSE_AFTER_QUESTION
        const userStartId = setTimeout(() => {
          setUserSpeaking(true)

          // Play interviewee video
          if (userVideoRef.current) {
            userVideoRef.current.currentTime = 0
            userVideoRef.current.play()
          }

          const userResponse = "Yes, at my previous company we migrated from on-prem to AWS over about 6 months. We primarily used ECS for containerization, RDS for databases, and S3 for storage. The main challenge was ensuring zero downtime, which we solved with a phased approach using Route 53 for traffic management."

          // Type out user response word by word
          const userWords = userResponse.split(' ')
          const userWordDelay = CONFIG.ANSWER_TYPING_DURATION / userWords.length
          for (let i = 0; i <= userWords.length; i++) {
            const userId = setTimeout(() => {
              if (!callActive || isPaused) return
              setUserTranscript(userWords.slice(0, i).join(' '))
            }, i * userWordDelay)
            timeoutIds.push(userId)
          }

          // User finishes speaking
          const userEndId = setTimeout(() => {
            setUserSpeaking(false)

            // Pause interviewee video
            if (userVideoRef.current) {
              userVideoRef.current.pause()
            }

            // Wait configured time before starting next question
            const restartId = setTimeout(() => {
              setCurrentQuestionIndex(prev => (prev + 1) % mockQuestions.length)
              askQuestion() // Restart the cycle
            }, CONFIG.PAUSE_AFTER_ANSWER)
            timeoutIds.push(restartId)
          }, CONFIG.INTERVIEWEE_VIDEO_DURATION)
          timeoutIds.push(userEndId)
        }, CONFIG.PAUSE_AFTER_QUESTION)
        timeoutIds.push(userStartId)
      }, CONFIG.INTERVIEWER_VIDEO_DURATION)
      timeoutIds.push(speakingEndId)

      // Type out hints progressively
      const hints = questionHints[currentQuestionIndex % questionHints.length]

      const hintsStartId = setTimeout(() => {
        // Process each category of hints
        const processHintCategory = (category: 'tips' | 'keyPhrases' | 'avoidPhrases' | 'bodyLanguageTips') => {
          const items = hints[category]
          if (!items || !items.length) return

          for (let i = 0; i < items.length; i++) {
            for (let j = 0; j <= items[i].length; j++) {
              const hintId = setTimeout(() => {
                if (!callActive || isPaused) return
                setCurrentHints(prev => ({
                  ...prev,
                  [category]: [
                    ...prev[category].slice(0, i),
                    items[i].slice(0, j),
                    ...prev[category].slice(i + 1)
                  ]
                }))
              }, (i * items[i].length * CONFIG.HINTS_TYPING_CHAR_DELAY) + (j * CONFIG.HINTS_TYPING_CHAR_DELAY))
              timeoutIds.push(hintId)
            }
          }
        }

        // Process all hint categories
        processHintCategory('tips')
        setTimeout(() => processHintCategory('keyPhrases'), 1000)
        setTimeout(() => processHintCategory('avoidPhrases'), 2000)
        setTimeout(() => processHintCategory('bodyLanguageTips'), 3000)

        const hintEndId = setTimeout(() => {
          setIsTypingHints(false)
        }, 5000)
        timeoutIds.push(hintEndId)
      }, CONFIG.HINTS_START_DELAY)
      timeoutIds.push(hintsStartId)
    }

    askQuestion()

    // Cleanup function
    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [callActive, isPaused, currentQuestionIndex])

  // UI Control Functions
  const endCall = () => {
    setCallActive(false)
    setAlertMessage("Interview session ended. Your recording has been saved.")
  }

  const toggleMic = () => setMicEnabled(!micEnabled)
  const toggleVideo = () => setVideoEnabled(!videoEnabled)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleHints = () => setShowHints(!showHints)
  const toggleRecording = () => setIsRecording(!isRecording)
  const togglePause = () => setIsPaused(!isPaused)
  const toggleAnalytics = () => setShowAnalytics(!showAnalytics)
  const toggleNotes = () => setShowNotes(!showNotes)
  const toggleDarkMode = () => setDarkMode(!darkMode)
  const toggleSettings = () => setShowSettings(!showSettings)

  const repeatQuestion = () => {
    // Restart the current question
    setCallActive(false)
    setTimeout(() => {
      setCallActive(true)
      setFeedbackVisible(false)
    }, 100)
  }

  const saveNotes = () => {
    if (notesRef.current) {
      setInterviewNotes(notesRef.current.value)
      setAlertMessage("Notes saved successfully")
      setTimeout(() => setAlertMessage(null), 3000)
    }
  }

  const dismissNotification = () => {
    setHasNewNotifications(false)
  }

  // Define the color scheme based on dark mode
  const colorScheme = darkMode
    ? {
      bg: "bg-gray-900",
      text: "text-white",
      textSecondary: "text-gray-300",
      cardBg: "bg-gray-800",
      border: "border-gray-700",
      accent: "from-blue-500 to-indigo-600",
      buttonBg: "bg-gray-700",
      buttonHover: "hover:bg-gray-600"
    }
    : {
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
    <div className={`h-screen ${colorScheme.bg} flex overflow-hidden font-sans transition-colors duration-300`}>
      {/* Add style tag for custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />

      {/* Alert notification */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="glass-effect px-4 py-3 rounded-lg shadow-lg border border-blue-200 animate-fade-in flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <AlertOctagon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-800">{alertMessage}</p>
          </div>
        </div>
      )}

      {/* Enhanced Sidebar */}
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
          <div className={`mx-3 p-5 ${darkMode ? 'bg-gray-800' : 'bg-slate-50'} rounded-xl shadow-sm mb-4 ${colorScheme.border} border`}>
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
                    {/* <span className="text-xs text-slate-400">{interviewerRole}</span> */}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {!sidebarCollapsed && (
            <div className={`mx-3 p-5 ${darkMode ? 'bg-gray-800' : 'bg-slate-50'} rounded-xl shadow-sm mb-4 ${colorScheme.border} border`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Performance</h3>
                <button
                  onClick={toggleAnalytics}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors rounded-full px-2 py-1 hover:bg-blue-50"
                >
                  {showAnalytics ? "Hide" : "Details"}
                </button>
              </div>

              <div className="space-y-3">
                {/* Overall Score Indicator */}
                <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 mb-2">
                    <span className="text-xl font-bold text-white">
                      {Math.round(Object.values(performanceMetrics).reduce((a, b) => a + b, 0) / Object.values(performanceMetrics).length)}%
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Overall Performance</span>
                </div>

                {/* Individual Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(performanceMetrics).map(([key, value], index) => (
                    <div key={index} className="p-2 bg-white rounded-lg shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-700 mt-1">{Math.round(value)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sensei Hints Section */}
          <div className={`mx-3 p-5 ${darkMode ? 'bg-gray-800' : 'bg-slate-50'} rounded-xl shadow-sm flex-1 ${colorScheme.border} border`}>
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Atom className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-blue-600">Response Tips</h3>
                </div>
                <button
                  onClick={toggleHints}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors rounded-full px-2 py-1 hover:bg-blue-50"
                >
                  {showHints ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {!sidebarCollapsed && showHints && (
              <div className="h-80 overflow-y-auto pr-1 hide-scrollbar">
                <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                  {/* Content Tips */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>Content Tips</span>
                    </h4>
                    <ul className="text-sm text-slate-700 space-y-3">
                      {currentHints.tips.filter(Boolean).map((tip, index) => (
                        <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                            <span className="text-blue-600 text-xs font-medium">{index + 1}</span>
                          </div>
                          <span className="font-medium">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Phrases */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-green-600 uppercase mb-2 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>Key Phrases</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentHints.keyPhrases.filter(Boolean).map((phrase, index) => (
                        <span key={index} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Phrases to Avoid */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" />
                      <span>Phrases to Avoid</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentHints.avoidPhrases.filter(Boolean).map((phrase, index) => (
                        <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Language Tips */}
                  <div>
                    <h4 className="text-xs font-semibold text-purple-600 uppercase mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Body Language</span>
                    </h4>
                    <ul className="text-sm text-slate-700 space-y-2">
                      {currentHints.bodyLanguageTips.filter(Boolean).map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                            <span className="text-purple-600 text-xs font-medium">•</span>
                          </div>
                          <span className="font-medium text-xs">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isTypingHints && (
                    <div className="absolute bottom-3 right-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="mx-3 p-3 mt-4 mb-2 flex items-center justify-between">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} shadow-sm border ${colorScheme.border}`}
              >
                {darkMode ? (
                  <Sun className={`w-4 h-4 ${colorScheme.text}`} />
                ) : (
                  <Moon className={`w-4 h-4 ${colorScheme.text}`} />
                )}
              </button>
              <button
                onClick={toggleNotes}
                className={`p-2 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} shadow-sm border ${colorScheme.border} ${showNotes ? 'bg-blue-50 border-blue-100' : ''}`}
              >
                <FileText className={`w-4 h-4 ${showNotes ? 'text-blue-600' : colorScheme.text}`} />
              </button>
              <button
                onClick={toggleAnalytics}
                className={`p-2 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} shadow-sm border ${colorScheme.border} ${showAnalytics ? 'bg-blue-50 border-blue-100' : ''}`}
              >
                <BarChart2 className={`w-4 h-4 ${showAnalytics ? 'text-blue-600' : colorScheme.text}`} />
              </button>
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-lg ${isRecording ? 'bg-red-50 border-red-100' : colorScheme.buttonBg} ${colorScheme.buttonHover} shadow-sm border ${colorScheme.border}`}
              >
                <Camera className={`w-4 h-4 ${isRecording ? 'text-red-600' : colorScheme.text}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden mx-2 my-2">
        {/* Enhanced Header */}
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
                onClick={() => { }}
                className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}
              >
                <Share className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={dismissNotification}
                className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500 relative`}
              >
                <FilePlus className="w-3.5 h-3.5" />
                {hasNewNotifications && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={() => { }}
                className={`p-1 rounded-lg ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-slate-500`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interview Area */}
        <div className="flex-1 overflow-y-auto p-2 hide-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* New Layout: Side-by-side interviewer and interviewee with questions and answers below each */}
            <div className={`${colorScheme.cardBg} rounded-xl shadow-lg overflow-hidden ${colorScheme.border} border transition-all duration-300 hover:shadow-xl`}>
              <div className="flex flex-col md:flex-row">
                {/* Left column: Interviewer Video and Question */}
                <div className="w-full md:w-1/2 flex flex-col">
                  {/* Interviewer Video */}
                  <div className={`p-3 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-slate-50'} flex flex-col items-center justify-center`}>
                    <div className={`relative aspect-video w-full max-w-sm overflow-hidden rounded-xl shadow-md transition-all duration-300 ${interviewerSpeaking ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      }`}>
                      <video
                        ref={videoRef}
                        src="int.mp4"
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

                      {/* No audio controls needed */}
                    </div>
                    <div className="flex items-center justify-between w-full max-w-sm mt-2">
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} font-medium`}>Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} font-medium`}>Difficulty:</span>
                        <span className={`text-xs ${darkMode ? 'text-white' : 'text-slate-700'} font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full`}>
                          {mockQuestions[currentQuestionIndex % mockQuestions.length].difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interviewer's Question - Now below interviewer video */}
                  <div className="px-3 pb-3">
                    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-slate-50 to-white'} p-3 rounded-xl w-full ${darkMode ? 'border-gray-700' : 'border-blue-50'} border shadow-sm`}>
                      <h3 className="font-medium text-slate-400 text-xs mb-1 uppercase tracking-wide">Interviewer&apos;s Question</h3>
                      <p className={`${colorScheme.text} font-medium text-sm leading-relaxed`}>
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
                <div className="w-full md:w-1/2 flex flex-col">
                  {/* User Video - Always visible with audio prompt overlay */}
                  <div className={`p-3 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-slate-50'} flex flex-col items-center justify-center`}>
                    <div className={`relative aspect-video w-full max-w-sm overflow-hidden rounded-xl shadow-md transition-all duration-300 ${userSpeaking ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      }`}>
                      <video
                        ref={userVideoRef}
                        src="female1.mp4"
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        autoPlay={false}
                        loop
                      />
                      <div className="absolute bottom-2 left-2">
                        <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white font-medium">You</span>
                            {userSpeaking && (
                              <>
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* No audio controls needed */}
                    </div>

                    {/* Real-time metrics */}
                    <div className="flex items-center justify-between w-full max-w-sm mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} font-medium`}>Confidence:</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${confidenceScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'} font-medium`}>Accuracy:</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${technicalAccuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Answer - Now below user video */}
                  <div className="px-3 pb-3">
                    <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-slate-50 to-white'} p-3 rounded-xl w-full ${darkMode ? 'border-gray-700' : 'border-blue-50'} border shadow-sm`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-slate-400 text-xs uppercase tracking-wide">Your Response</h3>
                        {userSpeaking && (
                          <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                            <Mic className="w-2.5 h-2.5 text-green-600" />
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-600">Speaking</span>
                          </div>
                        )}

                        {/* Completeness indicator */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">Completeness:</span>
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${answerCompleteness}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-slate-700'} text-sm leading-relaxed`}>
                        {userTranscript || (
                          <span className="text-slate-400 italic">Waiting for your response...</span>
                        )}
                      </p>

                      {/* Detected keywords */}
                      {userTranscript && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(userTranscript.includes("AWS") || userTranscript.includes("containerization") || userTranscript.includes("S3")) && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                              AWS
                            </span>
                          )}
                          {(userTranscript.includes("ECS") || userTranscript.includes("containerization")) && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                              Containers
                            </span>
                          )}
                          {userTranscript.includes("challenge") && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
                              Challenge
                            </span>
                          )}
                          {userTranscript.includes("zero downtime") && (
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                              Solution
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback panel */}
              {feedbackVisible && (
                <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-blue-50 border-t border-blue-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-blue-700'}`}>Response Analysis</h3>
                    <button onClick={() => setFeedbackVisible(false)} className="text-xs text-slate-500">Dismiss</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentFeedback.map((comment, index) => (
                      <div
                        key={index}
                        className={`p-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm flex items-start gap-2`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${index % 2 === 0 ? 'bg-green-100' : 'bg-blue-100'} flex items-center justify-center mt-0.5`}>
                          {index % 2 === 0 ? (
                            <ThumbsUp className={`w-3 h-3 ${index % 2 === 0 ? 'text-green-600' : 'text-blue-600'}`} />
                          ) : (
                            <Activity className={`w-3 h-3 ${index % 2 === 0 ? 'text-green-600' : 'text-blue-600'}`} />
                          )}
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{comment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes panel */}
              {showNotes && (
                <div className={`px-4 py-3 ${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-blue-50 border-t border-blue-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-blue-700'}`}>Interview Notes</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveNotes}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button onClick={toggleNotes} className="text-xs text-slate-500">Close</button>
                    </div>
                  </div>
                  <textarea
                    ref={notesRef}
                    className={`w-full p-2 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-slate-200'} border rounded-lg shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    rows={4}
                    placeholder="Take notes during the interview..."
                    defaultValue={interviewNotes}
                  ></textarea>
                  <p className="text-xs text-slate-500 mt-1">These notes will be saved with your interview recording.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Call Controls */}
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
              onClick={toggleSettings}
              aria-label="Settings"
              className={`w-8 h-8 rounded-full ${colorScheme.buttonBg} ${colorScheme.buttonHover} transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow ${colorScheme.border} border`}>
              <Settings className={`w-4 h-4 ${colorScheme.textSecondary}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel - conditionally rendered */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${colorScheme.cardBg} rounded-2xl shadow-2xl max-w-lg w-full p-6 ${colorScheme.border} border`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${colorScheme.text}`}>Interview Settings</h2>
              <button onClick={toggleSettings} className={`${colorScheme.textSecondary} hover:${colorScheme.text}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Interview Type */}
              <div>
                <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-1`}>Interview Type</label>
                <select
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                >
                  {interviewTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Choose the type of interview to practice</p>
              </div>

              {/* Interviewer */}
              <div>
                <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-1`}>Interviewer</label>
                <select
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  onChange={(e) => {
                    const persona = interviewerPersonas.find(p => p.id === e.target.value);
                    if (persona) {
                      setInterviewerName(persona.name);
                      setInterviewerRole(persona.role);
                    }
                  }}
                >
                  {interviewerPersonas.map(persona => (
                    <option key={persona.id} value={persona.id}>{persona.name} - {persona.style}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Setting */}
              <div>
                <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-1`}>Difficulty</label>
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-200'} text-sm font-medium text-slate-400`}>Easy</button>
                  <button className={`px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium border border-blue-500`}>Medium</button>
                  <button className={`px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-200'} text-sm font-medium text-slate-400`}>Hard</button>
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <label className={`block text-sm font-medium ${colorScheme.textSecondary} mb-2`}>Advanced Features</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colorScheme.text}`}>AI-Powered Feedback</span>
                    <div className="relative inline-block w-10 align-middle select-none">
                      <input type="checkbox" className="hidden" id="toggle-feedback" defaultChecked />
                      <label htmlFor="toggle-feedback" className="block h-6 overflow-hidden rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-0 transition-transform duration-200 ease-in-out"></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colorScheme.text}`}>Live Sentiment Analysis</span>
                    <div className="relative inline-block w-10 align-middle select-none">
                      <input type="checkbox" className="hidden" id="toggle-sentiment" defaultChecked />
                      <label htmlFor="toggle-sentiment" className="block h-6 overflow-hidden rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-4 transition-transform duration-200 ease-in-out"></span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colorScheme.text}`}>Technical Vocabulary Check</span>
                    <div className="relative inline-block w-10 align-middle select-none">
                      <input type="checkbox" className="hidden" id="toggle-vocabulary" defaultChecked />
                      <label htmlFor="toggle-vocabulary" className="block h-6 overflow-hidden rounded-full bg-gray-300 cursor-pointer">
                        <span className="block h-6 w-6 rounded-full bg-white transform translate-x-4 transition-transform duration-200 ease-in-out"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={toggleSettings}
                  className={`px-4 py-2 rounded-lg border ${colorScheme.buttonBg} ${colorScheme.buttonHover} text-sm font-medium ${colorScheme.textSecondary}`}
                >
                  Cancel
                </button>
                <button
                  onClick={toggleSettings}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewSession