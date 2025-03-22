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
  const [audioError, setAudioError] = useState<string | null>(null)
  const [responseBuffer, setResponseBuffer] = useState<ArrayBuffer | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)

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

  const convertToWavAndSend = async (audioBlob: Blob) => {
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
  const audioBufferToWav = (buffer: AudioBuffer): Promise<Blob> => {
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
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  const sendAudioToServer = async (audioBlob: Blob) => {
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
      
    } catch (error) {
      console.error("Error playing audio:", error)
      setAudioError(`Could not play audio: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Voice Assistant</CardTitle>
        <CardDescription>Record your voice and get an AI response</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full ${isRecording ? "bg-red-100 animate-pulse" : "bg-gray-100"}`}
          />
          <Button
            variant={isRecording ? "destructive" : "default"}
            size="icon"
            className="w-20 h-20 rounded-full relative z-10"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </Button>
        </div>

        {isRecording && (
          <div className="text-center">
            <p className="text-lg font-medium text-red-500">Recording...</p>
            <p className="text-sm">{formatTime(recordingTime)}</p>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Processing your request...</p>
          </div>
        )}

        {audioError && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md w-full">
            {audioError}
          </div>
        )}

        {responseBuffer && !isProcessing && !isRecording && (
          <div className="w-full">
            <p className="mb-2 text-sm font-medium">AI Response:</p>
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={isPlaying ? stopAudio : playAudio}
                >
                  {isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Stop</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAudio}>
                  <Download className="h-4 w-4 mr-2" /> Download WAV
                </Button>
              </div>
              
              <div className="h-10 w-full bg-gray-100 rounded-md flex items-center px-3">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: isPlaying ? "100%" : "0%", 
                    transition: isPlaying ? "width 0.1s linear" : "none",
                    animation: isPlaying ? "progress 10s linear" : "none"
                  }}
                />
              </div>
              
              {/* Audio file info */}
              <div className="text-xs text-gray-500 mt-2">
                Response size: {responseBuffer.byteLength} bytes | Format: WAV
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center flex-col">
        <p className="text-xs text-gray-500 mb-2">
          {isRecording
            ? "Click the stop button when you're done speaking"
            : "Click the microphone button to start recording"}
        </p>
        {responseBuffer && !isRecording && !isProcessing && (
          <p className="text-xs text-blue-500">
            Using Web Audio API for direct audio playback
          </p>
        )}
      </CardFooter>

      {/* CSS Animation for progress bar */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </Card>
  )
}
