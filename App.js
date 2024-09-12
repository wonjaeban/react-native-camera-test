import React, { useState, useEffect } from 'react';
import { View, Button, Text, FlatList, Alert, TouchableOpacity } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNFS from 'react-native-fs';
import Video from 'react-native-video'; // 동영상 재생을 위해 필요

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null); // 선택된 비디오의 경로

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // 필요한 권한을 요청하는 부분 (예: 카메라 권한, 파일 권한 등)
    setHasPermission(true);
  };

  const loadVideos = async () => {
    try {
      let videoDir;
  
      if (Platform.OS === 'android') {
        videoDir = `${RNFS.ExternalStorageDirectoryPath}/Videos`;
      } else if (Platform.OS === 'ios') {
        videoDir = `${RNFS.DocumentDirectoryPath}/Videos`;
      }
      
      const dirExists = await RNFS.exists(videoDir);
      if (!dirExists) {
        Alert.alert('Folder Not Found', `The folder "Videos" does not exist at path: ${videoDir}`);
        return;
      }

      const files = await RNFS.readDir(videoDir);
      const videoFiles = files.filter(file => file.name.endsWith('.mp4'));

      setVideos(videoFiles); // 동영상 목록을 상태에 저장
      console.log('Videos loaded:', videoFiles);

    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const saveFileToVideosDirectory = async (sourceUri) => {
    try {
      let videoDir;
      let destinationPath;
      const timestamp = new Date().getTime();

      if (Platform.OS === 'android') {
        videoDir = `${RNFS.ExternalStorageDirectoryPath}/Videos`;
      } else if (Platform.OS === 'ios') {
        videoDir = `${RNFS.DocumentDirectoryPath}/Videos`;
      }

      const dirExists = await RNFS.exists(videoDir);
      if (!dirExists) {
        await RNFS.mkdir(videoDir);
      }

      destinationPath = `${videoDir}/video_${timestamp}.mp4`;

      await RNFS.moveFile(sourceUri, destinationPath);
      console.log('File saved to Videos directory:', destinationPath);

    } catch (error) {
      console.error('Error saving file to Videos directory:', error);
    }
  };

  const recordVideo = async () => {
    if (cameraRef) {
      try {
        setIsRecording(true);
        const options = {
          quality: RNCamera.Constants.VideoQuality['480p'],
          maxDuration: 60,
        };
        const video = await cameraRef.recordAsync(options);

        await saveFileToVideosDirectory(video.uri);
        Alert.alert('Recorded', 'Video has been recorded and saved to your Videos folder.');

        loadVideos(); // 동영상 목록을 다시 로드
      } catch (error) {
        console.error('Error recording video:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef && isRecording) {
      cameraRef.stopRecording();
    }
  };

  // 동영상 삭제 함수
  const deleteVideo = async (path) => {
    try {
      await RNFS.unlink(path); // 파일 삭제
      Alert.alert('Deleted', 'The video has been deleted.');
      loadVideos(); // 동영상 목록을 다시 로드
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'An error occurred while deleting the video.');
    }
  };

  const renderVideoItem = ({ item }) => (
    <View style={{ marginVertical: 10 }}>
      <TouchableOpacity onPress={() => setSelectedVideo(item.path)}>
        <Text>{item.name}</Text>
      </TouchableOpacity>
      <Button title="Delete" onPress={() => deleteVideo(item.path)} />
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {selectedVideo ? (
        <Video
          source={{ uri: selectedVideo }}
          style={{ width: '100%', height: 300 }}
          controls={true}
          onEnd={() => setSelectedVideo(null)} 
        />
      ) : (
        <>
          <RNCamera
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
            captureAudio={true}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
            {isRecording ? (
              <Button title="Stop Recording" onPress={stopRecording} />
            ) : (
              <Button title="Record Video" onPress={recordVideo} />
            )}
            <Button title="Load Videos" onPress={loadVideos} />
          </View>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.path}
            renderItem={renderVideoItem}
          />
        </>
      )}
    </View>
  );
};

export default App;
