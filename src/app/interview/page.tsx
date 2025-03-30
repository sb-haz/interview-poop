'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, Atom, Clock, PanelLeft, Eye, EyeOff, Repeat } from 'lucide-react'
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

type InterviewQuestions = string[]

const mockQuestions: InterviewQuestions = [
  "Your CV mentions you led a migration to AWS. Can you tell us more about that experience and the challenges you faced?"
]

const questionHints = [
  {
    tips: [
      "Talk about why your team decided to migrate to AWS",
      "Mention which AWS services you used and why",
      "Share one key challenge and how you solved it"
    ]
  }
];

const InterviewSession: NextPage = () => {
  const [interviewerSpeaking, setInterviewerSpeaking] = useState<boolean>(false)
  const [userSpeaking, setUserSpeaking] = useState<boolean>(false)
  const [interviewerTranscript, setInterviewerTranscript] = useState<string>('')
  const [userTranscript, setUserTranscript] = useState<string>('')
  const [interviewerName] = useState<string>("AI Interviewer")
  const [micEnabled, setMicEnabled] = useState<boolean>(true)
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false)
  const [callActive, setCallActive] = useState<boolean>(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [interviewType] = useState<string>("Technical")
  const [showHints, setShowHints] = useState<boolean>(true)
  const [isTypingHints, setIsTypingHints] = useState<boolean>(false)
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false)
  const [currentHints, setCurrentHints] = useState({
    tips: [""]
  })
  
  // Video reference
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Function to handle video click - enables audio
  const handleVideoClick = () => {
    setAudioEnabled(true)
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.play()
    }
  }
  
  // Simulate interview flow
  useEffect(() => {
    if (!callActive) return
    
    const timeoutIds: NodeJS.Timeout[] = []
    
    // Auto-start the interview cycle
    const askQuestion = async () => {
      // Reset states
      setInterviewerTranscript('')
      setUserTranscript('')
      setIsTypingHints(false)
      
      // Interviewer asks question
      setInterviewerSpeaking(true)
      const question = mockQuestions[0] // Always use the AWS migration question
      
      // Play video
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.play()
      }
      
      // Type out question word by word over 8 seconds
      const words = question.split(' ')
      const wordTypingDelay = 7300 / words.length // Distribute 8 seconds across all words
      for (let i = 0; i <= words.length; i++) {
        if (!callActive) break
        const id = setTimeout(() => {
          setInterviewerTranscript(words.slice(0, i).join(' '))
        }, i * wordTypingDelay)
        timeoutIds.push(id)
      }
      
      // Interviewer finishes speaking after typing is complete
      const speakingEndId = setTimeout(() => {
        setInterviewerSpeaking(false)
        
        // Pause video
        if (videoRef.current) {
          videoRef.current.pause()
        }
        
        // Start typing hints
        setIsTypingHints(true)
        
        // Reset hints
        setCurrentHints({
          tips: [""]
        })
      }, 6800)
      timeoutIds.push(speakingEndId)
      
      // Type out hints progressively
      const hints = questionHints[0]
      
      const hintsStartId = setTimeout(() => {
        for (let i = 0; i < hints.tips.length; i++) {
          for (let j = 0; j <= hints.tips[i].length; j++) {
            const hintId = setTimeout(() => {
              if (!callActive) return
              setCurrentHints(prev => ({
                tips: [
                  ...prev.tips.slice(0, i),
                  hints.tips[i].slice(0, j),
                  ...prev.tips.slice(i + 1)
                ]
              }))
            }, (i * hints.tips[i].length * 5) + (j * 5))
            timeoutIds.push(hintId)
          }
        }
        
        const hintEndId = setTimeout(() => {
          setIsTypingHints(false)
        }, hints.tips.reduce((acc, tip) => acc + tip.length * 5, 0) + 100)
        timeoutIds.push(hintEndId)
      }, 8100)
      timeoutIds.push(hintsStartId)
      
      // User's turn to speak (simulated response) after 1s delay
      const userStartId = setTimeout(() => {
        setUserSpeaking(true)
        
        const userResponse = "Yes, at my previous company we migrated from on-prem to AWS over about 6 months. We primarily used ECS for containerization, RDS for databases, and S3 for storage. The main challenge was ensuring zero downtime, which we solved with a phased approach using Route 53 for traffic management."
        
        // Type out user response word by word
        const userWords = userResponse.split(' ')
        const userWordDelay = userResponse.length * 30 / userWords.length // Slower response
        for (let i = 0; i <= userWords.length; i++) {
          const userId = setTimeout(() => {
            if (!callActive) return
            setUserTranscript(userWords.slice(0, i).join(' '))
          }, i * userWordDelay)
          timeoutIds.push(userId)
        }
        
        // User finishes speaking
        const userEndId = setTimeout(() => {
          setUserSpeaking(false)
          
          // Wait 2 seconds then automatically restart the interview cycle
          const restartId = setTimeout(() => {
            askQuestion() // Restart the cycle
          }, 2000)
          timeoutIds.push(restartId)
        }, userResponse.length * 20 + 1000)
        timeoutIds.push(userEndId)
      }, 9000 + questionHints[0].tips.reduce((acc, tip) => acc + tip.length * 5, 0))
      timeoutIds.push(userStartId)
    }
    
    askQuestion()
    
    // Cleanup function
    return () => {
      timeoutIds.forEach(id => clearTimeout(id))
    }
  }, [callActive])

  const endCall = () => {
    setCallActive(false)
  }

  const toggleMic = () => setMicEnabled(!micEnabled)
  const toggleVideo = () => setVideoEnabled(!videoEnabled)
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed)
  const toggleHints = () => setShowHints(!showHints)
  
  const repeatQuestion = () => {
    // Restart the interview cycle
    setCallActive(false)
    setTimeout(() => setCallActive(true), 100)
  }
  
  return (
    <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex overflow-hidden font-sans">
      {/* Add style tag for custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />
      
      {/* Sidebar */}
      <div 
        className={`bg-white shadow-xl transition-all duration-300 flex flex-col rounded-r-2xl m-2 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}
      >
        {/* Logo */}
        <div className="p-5 mb-3 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg p-1.5">
                <Atom className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800">Interview Sensei</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="bg-blue-600 rounded-lg p-1.5 mx-auto">
              <Atom className="w-5 h-5 text-white" />
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1.5 hover:bg-slate-100"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Interview Info */}
          <div className="mx-3 p-5 bg-slate-50 rounded-xl shadow-sm mb-4">
            {!sidebarCollapsed && <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Interview Info</h3>}
            
            {!sidebarCollapsed && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Type:</span>
                  <span className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 rounded-full shadow-sm">{interviewType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Duration:</span>
                  <span className="text-sm font-medium text-slate-800">30 minutes</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Sensei Hints Section */}
          <div className="mx-3 p-5 bg-slate-50 rounded-xl shadow-sm flex-1">
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
                  <ul className="text-sm text-slate-700 space-y-4">
                    {currentHints.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                          <span className="text-blue-600 text-xs font-medium">{index + 1}</span>
                        </div>
                        <span className="font-medium">{tip}</span>
                      </li>
                    ))}
                  </ul>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden mx-2 my-2">
        {/* Header */}
        <div className="bg-white shadow-sm py-4 px-6 mx-2 mt-2 rounded-xl flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-slate-800">{interviewType} Interview</h1>
            <div className="ml-3 px-3 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-600">30 minutes</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-slate-600">Recording</span>
            </div>
          </div>
        </div>
        
        {/* Interview Area */}
        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          <div className="max-w-4xl mx-auto">
            {/* Restructured Layout: Main image with question side by side */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 mb-6 transition-all duration-300 hover:shadow-xl">
              <div className="flex flex-col md:flex-row">
                {/* Left column: Main Interviewer Video */}
                <div className="w-full md:w-2/5 p-5 bg-gradient-to-br from-blue-50 to-slate-50 flex flex-col items-center justify-center rounded-l-2xl">
                  <div className={`relative aspect-video w-full max-w-sm overflow-hidden rounded-2xl shadow-md transition-all duration-300 ${
                    interviewerSpeaking ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}>
                    <video 
                      ref={videoRef}
                      src="int.mp4"
                      className="w-full h-full object-cover cursor-pointer"
                      muted={!audioEnabled} 
                      playsInline
                      autoPlay
                      loop
                      onClick={handleVideoClick}
                    />
                    {!audioEnabled && (
                      <div 
                        className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer z-10"
                        onClick={handleVideoClick}
                      >
                        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                          Click to enable audio
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{interviewerName}</span>
                          {interviewerSpeaking && (
                            <>
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium">Question 4 of 10</p>
                </div>
                
                {/* Right column: Interviewer's Question */}
                <div className="w-full md:w-3/5 p-6 flex items-center">
                  <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-2xl w-full border border-blue-50 shadow-sm overflow-y-auto hide-scrollbar">
                    <h3 className="font-medium text-slate-400 text-sm mb-2 uppercase tracking-wide">Interviewer&apos;s Question</h3>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {interviewerTranscript || "Interviewer is about to ask a question..."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Answer Section - Full Width */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-b-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-800">Your Response</h3>
                  {userSpeaking && (
                    <div className="flex items-center gap-1.5 bg-green-100 px-2.5 py-1 rounded-full">
                      <Mic className="w-3 h-3 text-green-600" />
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600">Speaking</span>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 min-h-24 shadow-sm border border-blue-50 overflow-y-auto hide-scrollbar">
                  <p className="text-slate-700 leading-relaxed">
                    {userTranscript || (
                      <span className="text-slate-400 italic">Waiting for your response...</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call Controls */}
        <div className="bg-white shadow-lg p-6 mx-2 mb-2 rounded-xl flex justify-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={repeatQuestion} 
              aria-label="Repeat question"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg border border-slate-100">
              <Repeat className="w-5 h-5 text-slate-600" />
            </button>
            
            <button 
              onClick={toggleMic} 
              aria-label={micEnabled ? "Disable microphone" : "Enable microphone"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border ${
                micEnabled ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100' : 'bg-red-500 text-white hover:bg-red-600 border-red-400'
              }`}>
              {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={endCall} 
              aria-label="End call"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white flex items-center justify-center shadow-lg hover:shadow-xl border border-red-400">
              <PhoneOff className="w-7 h-7" />
            </button>
            
            <button 
              onClick={toggleVideo} 
              aria-label={videoEnabled ? "Disable video" : "Enable video"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg border ${
                videoEnabled ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100' : 'bg-red-500 text-white hover:bg-red-600 border-red-400'
              }`}>
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            
            <button 
              aria-label="Settings"
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg border border-slate-100">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewSession