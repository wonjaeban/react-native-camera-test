import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, FlatList, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import CameraRoll from '@react-native-community/cameraroll';
import * as MediaLibrary from 'expo-media-library';

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    requestPermissions();
    loadVideos();
  }, []);

  const requestPermissions = async () => {
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

    if (mediaStatus === 'granted') {
      setHasPermission(true);
    } else {
      Alert.alert('Permissions required', 'Media library permission is required!');
    }
  };

  const loadVideos = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: 'video',
      });
      setVideos(media.assets);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const recordVideo = async () => {
    if (cameraRef) {
      try {
        setIsRecording(true);
        const options = {
          quality: RNCamera.Constants.VideoQuality['480p'],
          maxDuration: 60, // 최대 녹화 시간 (초)
        };
        const video = await cameraRef.recordAsync(options);
        const savedUri = await CameraRoll.save(video.uri, { type: 'video' });
        Alert.alert('Recorded', 'Video has been recorded and saved to your gallery.');
        loadVideos();
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

  const deleteVideo = async (id) => {
    try {
      await MediaLibrary.deleteAssetsAsync([id]);
      Alert.alert('Deleted', 'The video has been deleted.');
      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'An error occurred while deleting the video.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={{ marginVertical: 10 }}>
      <Text>{item.filename}</Text>
      <Button title="Delete Video" onPress={() => deleteVideo(item.id)} />
    </View>
  );

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to media library</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default App;
