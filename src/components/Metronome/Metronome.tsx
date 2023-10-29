import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'
import * as Tone from 'tone'
import { TIME_SIGNATURES, validBpm } from '../../utils'
import { ControlCenter } from '../ControlCenter'
import { KVContext } from '../KVContextProvider/KVContextProvider'
import { MetroContext } from '../MetroContextProvider/MetroContextProvider'
import { Ticker } from '../Ticker'


//

const USER_ACTIVATION_EVENTS = [
  'auxclick',
  'click',
  'contextmenu',
  'dblclick',
  'keydown',
  'keyup',
  'mousedown',
  'mouseup',
  'touchend'
]

function unmuteIosAudio () {
  const AudioContext = window.webkitAudioContext

  // To detect iOS, check for touch device and confirm Safari-only
  // webkitAudioContext is present.
  const isIos = navigator.maxTouchPoints > 0 && AudioContext != null

  if (!isIos) return

  // state can be 'blocked', 'pending', 'allowed'
  let htmlAudioState = 'blocked'
  let webAudioState = 'blocked'

  let audio
  let context
  let source

  const sampleRate = (new AudioContext()).sampleRate
  const silentAudioFile = createSilentAudioFile(sampleRate)

  USER_ACTIVATION_EVENTS.forEach(eventName => {
    window.addEventListener(
      eventName, handleUserActivation, { capture: true, passive: true }
    )
  })

  // Return a seven samples long 8 bit mono WAVE file
  function createSilentAudioFile (sampleRate) {
    const arrayBuffer = new ArrayBuffer(10)
    const dataView = new DataView(arrayBuffer)

    dataView.setUint32(0, sampleRate, true)
    dataView.setUint32(4, sampleRate, true)
    dataView.setUint16(8, 1, true)

    const missingCharacters =
      window.btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        .slice(0, 13)

    return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${missingCharacters}AgAZGF0YQcAAACAgICAgICAAAA=`
  }

  function handleUserActivation (e) {
    if (htmlAudioState === 'blocked') {
      htmlAudioState = 'pending'
      createHtmlAudio()
    }
    if (webAudioState === 'blocked') {
      webAudioState = 'pending'
      createWebAudio()
    }
  }

  function createHtmlAudio () {
    audio = document.createElement('audio')

    audio.setAttribute('x-webkit-airplay', 'deny') // Disable the iOS control center media widget
    audio.preload = 'auto'
    audio.loop = true
    audio.src = silentAudioFile
    audio.load()

    audio.play().then(
      () => {
        htmlAudioState = 'allowed'
        maybeCleanup()
      },
      () => {
        htmlAudioState = 'blocked'

        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        audio = null
      }
    )
  }

  function createWebAudio () {
    context = new AudioContext()

    source = context.createBufferSource()
    source.buffer = context.createBuffer(1, 1, 22050) // .045 msec of silence
    source.connect(context.destination)
    source.start()

    if (context.state === 'running') {
      webAudioState = 'allowed'
      maybeCleanup()
    } else {
      webAudioState = 'blocked'

      source.disconnect(context.destination)
      source = null

      context.close()
      context = null
    }
  }

  function maybeCleanup () {
    if (htmlAudioState !== 'allowed' || webAudioState !== 'allowed') return

    USER_ACTIVATION_EVENTS.forEach(eventName => {
      window.removeEventListener(
        eventName, handleUserActivation, { capture: true, passive: true }
      )
    })
  }
}


//



const TickerWrapper = styled.div`
  width: 100%;
  height: 50vh;
  display: flex;
  justify-content: center;
  overflow: hidden;
  transform: translate(0, 20vh);
`

const markBounce = keyframes`
0% {
  opacity: 1;
}

3% {
  opacity: 0;
}

97% {
  opacity: 0;
}

100% {
  opacity: 1;
}
`

const MiddleMark = styled.div<{
  playing: boolean
  bps: number
  visible?: boolean
}>`
  ${({ playing, bps }) =>
    playing &&
    css`
      animation: ${markBounce} ${bps}s linear infinite;
    `}

  ${({ visible }) =>
    !visible &&
    css`
      display: none;
    `}

  position: absolute;
  border-radius: 50%;
  background-color: ${(p) => p.theme.extra.swingArmBg};
  width: 1.5vh;
  height: 1.5vh;
  top: 12vh;
  margin-left: auto;
  margin-right: auto;
  left: 0;
  right: 0;
`

const Metronome = () => {
  const {
    bpm,
    timeSignature = 0,
    setBpm,
    isPlaying = false,
    setIsPlaying,
    tapper,
  } = useContext(MetroContext)
  const { blinkOnTick, muteSound, showMetronome } = useContext(KVContext)
  const tickerRef = useRef(0)
  const [beatsPerMeasure, beatUnit] = TIME_SIGNATURES[timeSignature]

  const o1 = useMemo(
    () =>
      Tone.Offline(() => {
        const ampEnv = new Tone.AmplitudeEnvelope(0.01, 0.02, 1, 0.2)
        new Tone.Oscillator('C5', 'sine')
          .connect(ampEnv)
          .toDestination()
          .start()
          .stop('+0.1')
      }, 0.1),
    []
  )

  const o2 = useMemo(
    () =>
      Tone.Offline(() => {
        const ampEnv = new Tone.AmplitudeEnvelope(0.01, 0.02, 1, 0.2)
        new Tone.Oscillator('C4', 'sine')
          .connect(ampEnv)
          .toDestination()
          .start()
          .stop('+0.1')
      }, 0.1),
    []
  )

  const tone1 = useMemo(
    () => o1.then((o) => new Tone.Player(o).toDestination()),
    [o1]
  )

  const tone2 = useMemo(
    () => o2.then((o) => new Tone.Player(o).toDestination()),
    [o2]
  )

  const handleTick = useCallback(() => {
    const id = Tone.Transport.scheduleRepeat((time) => {
      const tick = Tone.Transport.getTicksAtTime(time) / Tone.Transport.PPQ
      if (tick % beatsPerMeasure === 0) {
        tone1.then((p) => {
          p.fadeIn = 0.005
          p.fadeOut = 0.012
          p.start(time).stop(time + 0.1)
        })
      } else {
        tone2.then((p) => {
          p.fadeIn = 0.005
          p.fadeOut = 0.012
          p.start(time).stop(time + 0.1)
        })
      }
    }, `${beatUnit}n`)

    tickerRef.current = id
  }, [beatsPerMeasure, beatUnit, tone1, tone2, tickerRef])

  useEffect(() => {
    Tone.Transport.set({
      bpm: bpm,
      timeSignature: beatsPerMeasure / beatUnit,
    })
  }, [bpm, beatsPerMeasure, beatUnit])

  useEffect(() => {
    Tone.Transport.stop()
    Tone.Transport.clear(tickerRef.current)

    if (isPlaying && !muteSound) {
      unmuteIosAudio ()
 
      handleTick()

      

      // Tone.start()
      Tone.Transport.start()
      // Tone.context.resume()
      // alert("start211")

      





  
      
    } else {
      Tone.Transport.stop()
      Tone.Transport.clear(tickerRef.current)
      // alert("stop")
    }
  }, [isPlaying, muteSound, handleTick, tickerRef, bpm])

  return (
    <div key={`${bpm}-${isPlaying}-${blinkOnTick}-${timeSignature}`}>
      {showMetronome && (
        <MiddleMark
          playing={isPlaying}
          bps={60 / (bpm || 0)}
          visible={blinkOnTick}
        />
      )}
      {showMetronome && (
        <TickerWrapper>
          <Ticker isPlaying={isPlaying} />
        </TickerWrapper>
      )}
      <ControlCenter
        onTempoChange={(tempo: number) => {
          if (!validBpm(tempo)) {
            return
          }

          setBpm?.(tempo)
        }}
        onPlay={() => {
          setIsPlaying?.(!isPlaying)
        }}
        isPlaying={isPlaying}
        handleTapTempo={() => {
          tapper?.tap()
          setBpm?.(tapper?.bpm)
        }}
      />
    </div>
  )
}

export default Metronome
