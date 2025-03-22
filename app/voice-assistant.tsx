"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, Pause, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VoiceAssistant({id}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioError, setAudioError] = useState(null)
  const [responseBuffer, setResponseBuffer] = useState(null)
  const [animationState, setAnimationState] = useState("idle") // New state for animations
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const waveformRef = useRef(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Add animation effect when recording starts/stops
  useEffect(() => {
    if (isRecording) {
      setAnimationState("recording")
    } else if (isProcessing) {
      setAnimationState("processing")
    } else if (isPlaying) {
      setAnimationState("playing")
    } else {
      setAnimationState("idle")
    }
  }, [isRecording, isProcessing, isPlaying])

  // Auto-play response when received
  useEffect(() => {
    if (responseBuffer && !isPlaying && !isProcessing) {
      // Short delay to allow UI to update first
      const timer = setTimeout(() => {
        playAudio()
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [responseBuffer, isProcessing])

  const startRecording = async () => {
    setAudioError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try to use WAV format if supported
      const mimeType = 'audio/wav';
      let options = {};
      
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options = { mimeType };
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current)
        console.log("Recording finished. Blob size:", audioBlob.size)
        convertToWavAndSend(audioBlob)
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setAudioError(`Could not access microphone: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const convertToWavAndSend = async (audioBlob) => {
    setIsProcessing(true)
    setAudioError(null)
    
    try {
      // Create AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Convert to WAV format
      const wavBlob = await audioBufferToWav(audioBuffer)
      
      // Send the WAV blob to server
      sendAudioToServer(wavBlob)
      
    } catch (error) {
      console.error("Error converting audio to WAV:", error)
      setAudioError(`Error converting to WAV: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsProcessing(false)
    }
  }

  // Function to convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer) => {
    return new Promise((resolve) => {
      const numOfChannels = buffer.numberOfChannels
      const length = buffer.length * numOfChannels * 2
      const sampleRate = buffer.sampleRate
      
      // Create WAV file header
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)
      
      // "RIFF" chunk descriptor
      writeString(view, 0, 'RIFF')
      view.setUint32(4, 36 + length, true)
      writeString(view, 8, 'WAVE')
      
      // "fmt " sub-chunk
      writeString(view, 12, 'fmt ')
      view.setUint32(16, 16, true) // subchunk1size
      view.setUint16(20, 1, true) // audio format (PCM)
      view.setUint16(22, numOfChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numOfChannels * 2, true) // byte rate
      view.setUint16(32, numOfChannels * 2, true) // block align
      view.setUint16(34, 16, true) // bits per sample
      
      // "data" sub-chunk
      writeString(view, 36, 'data')
      view.setUint32(40, length, true)
      
      // Create the audio data buffer
      const audioData = new ArrayBuffer(length)
      const output = new DataView(audioData)
      let offset = 0
      
      // Write interleaved audio data
      for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
          output.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
          offset += 2
        }
      }
      
      // Combine header and audio data
      const wavBlob = new Blob([wavHeader, audioData], { type: 'audio/wav' })
      resolve(wavBlob)
    })
  }
  
  // Helper function to write strings to DataView
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const sendAudioToServer = async (audioBlob) => {
    setResponseBuffer(null)
    stopAudio() // Stop any playing audio

    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.wav") // Explicitly name it with .wav extension

      const requestOptions = {
        method: "POST",
        body: formData,
      }

      console.log("Sending audio to server...")
      const response = await fetch(`https://aiverse.exam24.xyz/v1/character/${id}/upload`, requestOptions)
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }
      
      console.log("Server response status:", response.status)
      
      // Get response as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer()
      console.log("Response size:", arrayBuffer.byteLength, "bytes")
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Server returned empty response")
      }

      // Store the buffer for later use
      setResponseBuffer(arrayBuffer)
      
      console.log("Audio data received successfully")
      // Note: Auto-playback is now handled by the useEffect

    } catch (error) {
      console.error("Error processing audio:", error)
      setAudioError(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudio = async () => {
    if (!responseBuffer) return
    
    try {
      // Stop any currently playing audio
      stopAudio()
      
      // Create new AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      
      const context = audioContextRef.current
      
      // Decode the audio data
      const audioBuffer = await context.decodeAudioData(responseBuffer.slice(0))
      
      // Create source node
      const source = context.createBufferSource()
      source.buffer = audioBuffer
      source.connect(context.destination)
      
      // Set up event handlers
      source.onended = () => {
        setIsPlaying(false)
        sourceNodeRef.current = null
      }
      
      // Start playback
      source.start(0)
      sourceNodeRef.current = source
      setIsPlaying(true)
      
      // Generate simple waveform visualization data
      generateWaveform(audioBuffer)
      
    } catch (error) {
      console.error("Error playing audio:", error)
      setAudioError(`Could not play audio: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
  
  // Generate a simple waveform visualization
  const generateWaveform = (audioBuffer) => {
    const channel = audioBuffer.getChannelData(0)
    const segments = 50 // Number of segments in waveform
    const segmentSize = Math.floor(channel.length / segments)
    
    const waveform = []
    
    for (let i = 0; i < segments; i++) {
      let sum = 0
      for (let j = 0; j < segmentSize; j++) {
        const sampleIndex = i * segmentSize + j
        if (sampleIndex < channel.length) {
          sum += Math.abs(channel[sampleIndex])
        }
      }
      const average = sum / segmentSize
      waveform.push(average * 2) // Scale for better visibility
    }
    
    waveformRef.current = waveform
  }
  
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
      } catch (e) {
        // Ignore errors from already stopped sources
      }
      sourceNodeRef.current = null
    }
    setIsPlaying(false)
  }

  const downloadAudio = () => {
    if (responseBuffer) {
      const blob = new Blob([responseBuffer], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai-response.wav'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg transform transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Voice Assistant</CardTitle>
        <CardDescription className="text-center">Record your voice and get an AI response</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 py-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer rings animation */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            animationState === "recording" 
              ? "bg-red-50 scale-100" 
              : animationState === "processing" 
                ? "bg-yellow-50 scale-110" 
                : animationState === "playing" 
                  ? "bg-green-50 scale-105" 
                  : "bg-gray-50"
          }`}>
            {/* Pulsing animation for recording */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-25"></div>
                <div className="absolute inset-0 rounded-full bg-red-50 animate-pulse"></div>
              </>
            )}
            
            {/* Processing animation */}
            {isProcessing && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-yellow-200 animate-spin-slow"></div>
              </div>
            )}
            
            {/* Playing animation */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-green-50"></div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute h-1/2 w-1 bg-green-300 rounded-full origin-bottom"
                    style={{
                      transform: `rotate(${i * 45}deg) scaleY(${0.3 + Math.random() * 0.7})`,
                      animation: `equalizer 1s ease-in-out infinite ${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
          
          {/* Main button with animations */}
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            className={`w-24 h-24 rounded-full relative z-10 transition-all duration-300 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200" 
                : isProcessing 
                  ? "bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-200 cursor-wait" 
                  : isPlaying 
                    ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200" 
                    : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <Square className="h-10 w-10 text-white animate-pulse" />
            ) : isProcessing ? (
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            ) : (
              <Mic className={`h-10 w-10 text-white ${!isPlaying && !isProcessing ? "animate-bounce-subtle" : ""}`} />
            )}
          </Button>
        </div>

        {isRecording && (
          <div className="text-center transform transition-all duration-300 animate-fade-in">
            <p className="text-lg font-medium text-red-500">Recording...</p>
            <p className="text-sm bg-red-50 px-3 py-1 rounded-full mt-1">{formatTime(recordingTime)}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-full animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <p className="text-yellow-700">Processing your request...</p>
          </div>
        )}

        {audioError && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md w-full border border-red-200 shadow-sm animate-fade-in">
            {audioError}
          </div>
        )}

        {responseBuffer && !isProcessing && !isRecording && (
          <div className="w-full animate-slide-up">
            <p className="mb-2 text-sm font-medium flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              AI Response Ready
            </p>
            <div className="flex flex-col space-y-3 w-full">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={isPlaying ? stopAudio : playAudio}
                  className={`transition-all duration-300 ${isPlaying ? "bg-green-50 text-green-700 border-green-200" : "hover:bg-blue-50"}`}
                >
                  {isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Stop</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
                {/* <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadAudio}
                  className="transition-all duration-300 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" /> Download WAV
                </Button> */}
              </div>
              
              {/* Custom waveform visualization */}
              <div className="h-16 w-full bg-gray-50 rounded-md flex items-center justify-center p-2 overflow-hidden">
                {waveformRef.current && (
                  <div className="flex items-center h-full w-full space-x-1">
                    {waveformRef.current.map((value, index) => (
                      <div 
                        key={index}
                        className="h-full flex items-center justify-center"
                        style={{ width: `${100 / waveformRef.current.length}%` }}
                      >
                        <div 
                          className={`w-full rounded-sm ${isPlaying ? "bg-blue-500" : "bg-blue-300"}`}
                          style={{ 
                            height: `${Math.min(100, value * 100)}%`,
                            transform: isPlaying ? "scaleY(1)" : "scaleY(0.7)",
                            transition: "transform 0.3s ease, background-color 0.3s ease",
                            animationDelay: `${index * 0.02}s`,
                            animation: isPlaying ? `equalize 1s ease-in-out infinite ${index * 0.02}s` : "none"
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Progress indicator for playback */}
                {isPlaying && (
                  <div 
                    className="absolute top-0 left-0 h-1 bg-blue-600"
                    style={{ 
                      width: "100%", 
                      transformOrigin: "left",
                      transform: "scaleX(0)",
                      animation: "progress-animation 10s linear forwards"
                    }}
                  ></div>
                )}
              </div>
              
              {/* Audio file info with animation */}
              <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100 transition-all duration-300 hover:bg-gray-100">
                <div className="flex justify-between">
                  <span>Response size: {(responseBuffer.byteLength / 1024).toFixed(1)} KB</span>
                  <span>Format: WAV</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center flex-col bg-gradient-to-r from-blue-50 to-indigo-50 rounded-b-lg">
        <p className="text-xs text-gray-500 mb-2">
          {isRecording
            ? "Click the stop button when you're done speaking"
            : isProcessing
            ? "Please wait while we process your audio..."
            : responseBuffer
            ? "Playback is automatic. Click play to hear again."
            : "Click the microphone button to start recording"}
        </p>
        {responseBuffer && !isRecording && !isProcessing && (
          <p className="text-xs text-blue-500 flex items-center justify-center">
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Using Web Audio API for enhanced audio experience
          </p>
        )}
      </CardFooter>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes progress-animation {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        
        @keyframes animate-ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes equalize {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s forwards;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </Card>
  )
}