// MetroContextProvider.js
import React, { createContext, FC, Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import * as Tone from 'tone';
import TempoTapper from './TempoTapper';
import { TIME_SIGNATURES } from './utils';

type MetroContextType = {
  children?: React.ReactNode;
  bpm?: number;
  timeSignature?: number;
  isPlaying?: boolean;
  isShowingSidebar?: boolean;
  tapper?: TempoTapper;
  audioContext?: AudioContext;
  setBpm?: Dispatch<SetStateAction<number>>;
  setTimeSignature?: Dispatch<SetStateAction<number>>;
  setIsPlaying?: Dispatch<SetStateAction<boolean>>;
  setIsShowingSidebar?: Dispatch<SetStateAction<boolean>>;
  setAudioContext?: Dispatch<SetStateAction<AudioContext>>;
};

export const MetroContext = createContext({} as MetroContextType);

const MetroContextProvider: FC<MetroContextType> = ({ children }) => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSidebar, setIsShowingSidebar] = useState(false);
  const [timeSignature, setTimeSignature] = useState<number>(0);
  const tapper = useMemo(() => new TempoTapper(), []);
  const [audioContext, setAudioContext] = useState(
    () => new (window.AudioContext || window.webkitAudioContext)()
  );

  useEffect(() => {
    if (timeSignature >= TIME_SIGNATURES.length - 1) {
      setTimeSignature(0);
    }
  }, [timeSignature]);

  useEffect(() => {
    Tone.setContext(audioContext);
  }, [audioContext]);

  const context: MetroContextType = {
    bpm,
    timeSignature,
    isPlaying,
    isShowingSidebar,
    tapper,
    audioContext,
    setBpm,
    setTimeSignature,
    setIsPlaying,
    setIsShowingSidebar,
    setAudioContext,
  };

  return (
    <MetroContext.Provider value={context}>{children}</MetroContext.Provider>
  );
};

export default MetroContextProvider;
