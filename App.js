import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import {RNCamera} from 'react-native-camera';
import RNFS from 'react-native-fs';

const App = () => {
  const [media, setMedia] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);

      if (
        granted['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.CAMERA'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('You can use the storage and camera');
      } else {
        console.log('Permission denied');
      }
    }
  };

  const takeVideo = async maxDuration => {
    try {
      if (!cameraRef.current) {
        throw Error('카메라가 준비되지 않아 녹화를 진행할 수 없습니다.');
      }

      const recordData = await cameraRef.current.recordAsync({
        mute: false,
        videoBitrate: 300 * 1000, // 300Kbps
        quality: RNCamera.Constants.VideoQuality['480p'],
        maxDuration,
        codec:
          Platform.OS === 'ios'
            ? RNCamera.Constants.VideoCodec.H264
            : undefined,
      });

      if (!recordData) {
        throw Error('기기의 녹화 기능에 이상이 있을 수 있습니다.');
      }

      saveToGallery(recordData.uri);
      return recordData;
    } catch (err) {
      console.error('녹화 실패', err);
      return null;
    }
  };

  const saveToGallery = async uri => {
    try {
      const savedUri = await CameraRoll.save(uri, {type: 'video'});
      console.log('Saved to gallery:', savedUri);
      loadMedia();
    } catch (error) {
      console.error('Error saving to gallery:', error);
    }
  };

  const loadMedia = async () => {
    try {
      const mediaData = await CameraRoll.getPhotos({
        first: 1,
        assetType: 'All',
      });
      setMedia(mediaData.edges);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const deleteMediaFile = async uri => {
    try {
      const filePath = uri.replace('file://', '');
      const result = await RNFS.exists(filePath);
      if (result) {
        await RNFS.unlink(filePath);
        console.log('File deleted successfully');
        loadMedia();
      }
    } catch (e) {
      console.error('Error deleting media:', e);
    }
  };

  return (
    <View style={{flex: 1, padding: 20}}>
      <RNCamera
        ref={cameraRef}
        style={{flex: 1}}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        captureAudio={true}
      />
      <Button title="Record Video" onPress={() => takeVideo(10)} />
      {/* 10초 동안 녹화 */}
      <Button title="Load Gallery Media" onPress={loadMedia} />
      <FlatList
        data={media}
        keyExtractor={item => item.node.image.uri}
        renderItem={({item}) => (
          <View style={{marginVertical: 10}}>
            {item.node.type.startsWith('video') ? (
              <Text>{item.node.image.uri}</Text>
            ) : (
              <Image
                source={{uri: item.node.image.uri}}
                style={{width: 100, height: 100}}
              />
            )}
            <Button
              title="Delete Media"
              onPress={() => deleteMediaFile(item.node.image.uri)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default App;
