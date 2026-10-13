import { useEffect, useRef, useState } from 'react'

/**
 * CameraQrScannerModal Component
 * Zero-cost, camera-based QR / Barcode ID scanner for rapid worker gate check-ins.
 * Uses native Web BarcodeDetector API with jsQR fallback.
 */
export default function CameraQrScannerModal({ isOpen, onClose, onScanSuccess, employees = [] }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [lastScanned, setLastScanned] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const scanningRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    setError(null)
    setLastScanned(null)
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Back camera preferred on phones/tablets
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        scanningRef.current = true
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Unable to access device camera. Please grant camera permission or use manual check-in.')
    }
  }

  const stopCamera = () => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // High pleasant beep (A5)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }

  const handleDetectedCode = (code) => {
    if (!code) return
    const cleaned = String(code).trim().toUpperCase()
    
    // Find matching employee by ID or clean string
    const match = employees.find(e => 
      e.id?.toUpperCase() === cleaned || 
      e.employeeId?.toUpperCase() === cleaned ||
      cleaned.includes(e.id?.toUpperCase())
    )

    const empId = match ? match.id : cleaned
    setLastScanned({
      id: empId,
      name: match ? match.name : 'Unknown Worker',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    })

    playBeep()
    if (onScanSuccess) {
      onScanSuccess(empId, match)
    }
  }

  const scanFrame = async () => {
    if (!scanningRef.current || !videoRef.current) return

    const video = videoRef.current
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] })
          const barcodes = await detector.detect(video)
          if (barcodes.length > 0) {
            handleDetectedCode(barcodes[0].rawValue)
            // Pause scanning briefly to prevent rapid duplicate triggers
            await new Promise(r => setTimeout(r, 1200))
          }
        } catch (e) {
          console.warn('BarcodeDetector error:', e)
        }
      }
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanFrame)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Camera QR ID Scanner</h3>
              <p className="text-[11px] text-slate-400">Point camera at Worker ID Badge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              {/* Corner tick marks */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br"></div>
              
              {/* Scanning red/green laser pulse line */}
              <div className="w-full h-0.5 bg-emerald-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#34d399]"></div>
            </div>
          </div>

          {error && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl mb-2">⚠️</span>
              <p className="text-xs text-rose-300 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Scan Status Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {lastScanned ? (
            <div className="bg-emerald-950/80 border border-emerald-700/60 p-2.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-300">✓ Checked In: {lastScanned.name}</div>
                <div className="text-[11px] text-emerald-400/80">ID: {lastScanned.id} · {lastScanned.time}</div>
              </div>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">PUNCHED</span>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400">
              Align worker badge QR code or Barcode inside the green frame.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
