import { useEffect, useRef, useState, useCallback } from 'react';
import VERTC from '@volcengine/rtc';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { rtcConnectRetry } from '../utils/rtc-connect-retry';

// 临时使用 any 来绕过 SDK 类型不匹配问题，后续可以根据实际导出的类型修正
type IEngine = any;
type IRoom = any;

interface UseRtcProps {
  roomId: string;
  userId: string;
  onRemoteUserJoin?: (userId: string) => void;
  onRemoteUserLeave?: (userId: string) => void;
  onRemoteStreamPublished?: (userId: string, type: 'audio' | 'video') => void;
  onRemoteStreamUnpublished?: (userId: string, type: 'audio' | 'video') => void;
}

export const useRtc = ({
  roomId,
  userId,
  onRemoteUserJoin,
  onRemoteUserLeave,
  onRemoteStreamPublished,
  onRemoteStreamUnpublished,
}: UseRtcProps) => {
  const rtcEngine = useRef<IEngine | null>(null);
  const rtcRoom = useRef<IRoom | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<boolean>(false);
  const [localAudioTrack, setLocalAudioTrack] = useState<boolean>(false);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
  const joinedRoomIdRef = useRef<string | null>(null);
  const joiningRef = useRef(false);

  const normalizeRoomId = useCallback((id: string) => {
    const value = String(id || '').trim();
    if (!value) {
      throw new Error('roomId should not be empty');
    }
    return value;
  }, []);

  // 初始化引擎
  const initEngine = useCallback(async (appId: string) => {
    if (rtcEngine.current) return;
    
    rtcEngine.current = VERTC.createEngine(appId);
    
    // 监听事件
    rtcEngine.current.on('onUserJoined', (event: any) => {
      setRemoteUsers(prev => [...new Set([...prev, event.userId])]);
      onRemoteUserJoin?.(event.userId);
    });

    rtcEngine.current.on('onUserLeave', (event: any) => {
      setRemoteUsers(prev => prev.filter(id => id !== event.userId));
      onRemoteUserLeave?.(event.userId);
    });

    rtcEngine.current.on('onUserPublishStream', (event: any) => {
        // 处理远端流发布
        onRemoteStreamPublished?.(event.userId, event.mediaType === 0 ? 'audio' : 'video');
    });

    rtcEngine.current.on('onUserUnpublishStream', (event: any) => {
        // 处理远端流取消发布
        onRemoteStreamUnpublished?.(event.userId, event.mediaType === 0 ? 'audio' : 'video');
    });
  }, [onRemoteUserJoin, onRemoteUserLeave, onRemoteStreamPublished, onRemoteStreamUnpublished]);

  // 加入房间
  const joinRoom = useCallback(async (mode: 'audio' | 'video', targetRoomId?: string) => {
    try {
      if (joiningRef.current) {
        return;
      }
      const finalRoomId = normalizeRoomId(targetRoomId ?? roomId);
      if (isJoined && joinedRoomIdRef.current === finalRoomId) {
        return;
      }
      joiningRef.current = true;
      await rtcConnectRetry(async () => {
        const response = await api.post('/rtc/get-token', {
          roomId: finalRoomId,
          userId,
        });
        const { token, appId } = response as unknown as { token: string; appId: string };
        if (!token || !appId) {
          throw new Error('RTC token 或 appId 为空');
        }

        await initEngine(appId);
        if (!rtcEngine.current) {
          throw new Error('RTC engine 初始化失败');
        }

        const roomConfig = {
          isAutoPublish: true,
          isAutoSubscribeAudio: true,
          isAutoSubscribeVideo: true,
        };

        if (typeof rtcEngine.current.createRoom === 'function') {
          rtcRoom.current = rtcEngine.current.createRoom(finalRoomId);
          await rtcRoom.current.joinRoom(token, { userId }, roomConfig);
          return;
        }

        if (typeof rtcEngine.current.joinRoom === 'function') {
          await rtcEngine.current.joinRoom(token, finalRoomId, { userId }, roomConfig);
          return;
        }

        throw new Error('SDK does not support createRoom/joinRoom APIs');
      });

      setIsJoined(true);
      joinedRoomIdRef.current = finalRoomId;

      if (mode === 'video') {
        if (rtcEngine.current && typeof rtcEngine.current.startVideoCapture === 'function') {
          await rtcEngine.current.startVideoCapture();
          setLocalVideoTrack(true);
        }
      }
      if (rtcEngine.current && typeof rtcEngine.current.startAudioCapture === 'function') {
        await rtcEngine.current.startAudioCapture();
        setLocalAudioTrack(true);
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Join RTC room failed:', error);
      if (message.includes('Already joined')) {
        setIsJoined(true);
      } else if (message.includes('token_error')) {
        toast.error('通话初始化失败: token_error，请重试或检查 RTC 服务端 Token 生成');
      } else {
        toast.error(`通话初始化失败: ${message}`);
      }
    } finally {
      joiningRef.current = false;
    }
  }, [roomId, userId, initEngine, normalizeRoomId, isJoined]);

  // 离开房间
  const leaveRoom = useCallback(async () => {
    if (rtcRoom.current && typeof rtcRoom.current.leaveRoom === 'function') {
      await rtcRoom.current.leaveRoom();
      rtcRoom.current = null;
    } else if (rtcEngine.current && typeof rtcEngine.current.leaveRoom === 'function') {
      await rtcEngine.current.leaveRoom();
    }
    if (rtcEngine.current) {
      await rtcEngine.current.stopVideoCapture();
      await rtcEngine.current.stopAudioCapture();
      setLocalVideoTrack(false);
      setLocalAudioTrack(false);
    }
    setIsJoined(false);
    joinedRoomIdRef.current = null;
    setRemoteUsers([]);
  }, []);

  // 切换音视频状态
  const toggleAudio = useCallback(async () => {
    if (!rtcEngine.current) return;
    if (localAudioTrack) {
      await rtcEngine.current.stopAudioCapture();
    } else {
      await rtcEngine.current.startAudioCapture();
    }
    setLocalAudioTrack(!localAudioTrack);
  }, [localAudioTrack]);

  const toggleVideo = useCallback(async () => {
    if (!rtcEngine.current) return;
    if (localVideoTrack) {
      await rtcEngine.current.stopVideoCapture();
    } else {
      await rtcEngine.current.startVideoCapture();
    }
    setLocalVideoTrack(!localVideoTrack);
  }, [localVideoTrack]);

  // 渲染视频流
  const setLocalVideoPlayer = useCallback((element: HTMLElement | null) => {
    if (rtcEngine.current && element && localVideoTrack) {
      try {
        rtcEngine.current.setLocalVideoPlayer(0, { // 0: STREAM_INDEX_MAIN
          dom: element,
          renderMode: 1, // 1: RENDER_MODE_HIDDEN
        });
      } catch (err) {
        console.warn('Set local video player failed, might be SDK state issue:', err);
      }
    }
  }, [localVideoTrack]);

  const setRemoteVideoPlayer = useCallback((remoteUserId: string, element: HTMLElement | null) => {
    if (rtcEngine.current && element) {
      try {
        rtcEngine.current.setRemoteVideoPlayer(remoteUserId, 0, { // 0: STREAM_INDEX_MAIN
          dom: element,
          renderMode: 1, // 1: RENDER_MODE_HIDDEN
        });
      } catch (err) {
        console.warn('Set remote video player failed, might be SDK state issue:', err);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      leaveRoom();
      if (rtcEngine.current) {
        VERTC.destroyEngine(rtcEngine.current);
        rtcEngine.current = null;
      }
    };
  }, [leaveRoom]);

  return {
    isJoined,
    remoteUsers,
    localAudioTrack,
    localVideoTrack,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    setLocalVideoPlayer,
    setRemoteVideoPlayer,
  };
};
