import { useEffect, useRef } from "react";
import { ReactMediaRecorder } from "react-media-recorder";

interface AutoVoiceRecorderProps {
  startRecording: boolean;
  stopRecording: boolean;
  onStop: (blobUrl: string, blob: Blob) => void;
}

export default function AutoVoiceRecorder({
  startRecording,
  stopRecording,
  onStop,
}: AutoVoiceRecorderProps) {
  const hasStopped = useRef(false);
  const startFn = useRef<() => void>(() => {});
  const stopFn = useRef<() => void>(() => {});

  useEffect(() => {
    if (startRecording) {
      hasStopped.current = false;
      startFn.current();
    }
  }, [startRecording]);

  useEffect(() => {
    if (stopRecording) {
      stopFn.current();
    }
  }, [stopRecording]);

  return (
    <ReactMediaRecorder
      audio
      blobPropertyBag={{ type: "audio/wav" }}
      onStop={(blobUrl, blob) => {
        if (!hasStopped.current) {
          hasStopped.current = true;
          onStop(blobUrl, blob);
        }
      }}
      render={({ startRecording: start, stopRecording: stop }) => {
        startFn.current = start;
        stopFn.current = stop;

        return <></>;
      }}
    />
  );
}
