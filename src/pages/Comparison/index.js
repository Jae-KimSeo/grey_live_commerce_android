/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ImageBackground,
} from 'react-native';
import { NodePlayerView } from 'react-native-nodemediaclient';
import get from 'lodash/get';
import styles from './styles';
import StreamCard from './StreamCard';
import { HTTP } from '../../config';
import SocketManager from '../../socketManager';

class Comparison extends React.Component {
  constructor(props) {
    super(props);

    const { route } = props;
    const userName = get(route, 'params.userName', '');
    const roomName = get(route, 'params.roomName');
    const viewerName = get(route, 'params.viewerName');
    let audioStatusOne = get(route, 'params.audioStatus');

    const streamTwoHandler = this.streamTwoHandler.bind(this);
    const streamOneHandler = this.streamOneHandler.bind(this);

    // const isPortrait = () => {
    //   const dim = Dimensions.get('screen');
    //   return dim.height >= dim.width;
    // };

    this.state = {
      // orientation: isPortrait() ? 'portrait' : 'landscape',
      inputUrlFirst: null,
      inputUrlSecond: null,
      streamOneName: roomName,
      streamTwoName: '',
      streamCards: [],
      streamCardsFull: [],
      opacityOne: 0,
      opacityTwo: 0,
      audioStatusOne: audioStatusOne,
      audioStatusTwo: true,
      audioIconOne: require('../../assets/ico_soundon.png'),
      audioIconTwo: require('../../assets/ico_soundon.png'),
    };

    // Dimensions.addEventListener('change', () => {
    //   this.setState({
    //     orientation: isPortrait() ? 'portrait' : 'landscape',
    //   });
    // });
    this.roomName = roomName;
    this.userName = userName;
    this.viewerName = viewerName;
    this.scrollOffset = 0;
  }

  componentDidMount() {
    SocketManager.instance.emitGetStreamCards();
    SocketManager.instance.listenGetStreamCards((data) => {
      console.log('data received:', data);
      this.setState({ streamCards: data });
    });

    this.setState({
      inputUrlFirst: `${HTTP}/live/${this.state.streamOneName}.flv`,
      // use HLS from trasporting in media server to Viewer
      // inputUrlSecond: `${HTTP}/live/${this.state.streamTwoName}.flv`,
    });

    setTimeout(() => {
      this.setState({ opacityOne: 1 });
    }, 2000);
  }

  streamTwoHandler(roomName) {
    this.setState({ opacityTwo: 0 });
    setTimeout(() => {
      this.setState({ opacityTwo: 1 });
    }, 2000);
    this.setState({ streamTwoName: roomName });
    this.setState({ inputUrlSecond: null });
    this.setState({ inputUrlSecond: `${HTTP}/live/${roomName}.flv` });
    console.log('stream two url:', this.state.inputUrlSecond);
  }

  streamOneHandler(roomName) {
    this.setState({ opacityOne: 0 });
    setTimeout(() => {
      this.setState({ opacityOne: 1 });
    }, 2000);
    this.setState({ streamOneName: roomName });
    this.setState({ inputUrlFirst: null });
    this.setState({ inputUrlFirst: `${HTTP}/live/${roomName}.flv` });
    console.log('stream one url:', this.state.inputUrlFirst);
  }

  componentDidMount() {
    SocketManager.instance.emitGetStreamCards();
    SocketManager.instance.listenGetStreamCards((data) => {
      console.log('data received:', data);
      this.setState({ streamCards: data });
    });

    SocketManager.instance.emitListLiveStream();
    SocketManager.instance.listenListLiveStream((data) => {
      this.setState({ streamCardsFull: data });
    });

    this.setState({
      inputUrlFirst: `${HTTP}/live/${this.state.streamOneName}.flv`,
      // use HLS from trasporting in media server to Viewer
      // inputUrlSecond: `${HTTP}/live/${this.state.streamTwoName}.flv`,
    });

    setTimeout(() => {
      this.setState({ opacityOne: 1 });
    }, 2000);
  }

  renderPortraitNodePlayerViewOne = (inputUrl) => {
    if (!inputUrl) return null;
    return (
      <NodePlayerView
        style={styles.streamOnePortrait}
        ref={(vb) => {
          this.nodePlayerView = vb;
        }}
        inputUrl={inputUrl}
        scaleMode="ScaleAspectFit"
        bufferTime={300}
        maxBufferTime={1000}
        audioEnable={this.state.audioStatusOne}
        autoplay
      />
    );
  };

  renderPortraitNodePlayerViewTwo = (inputUrl) => {
    if (!inputUrl) return null;
    return (
      <NodePlayerView
        style={styles.streamOnePortrait}
        ref={(vb) => {
          this.nodePlayerView = vb;
        }}
        inputUrl={inputUrl}
        scaleMode="ScaleAspectFit"
        bufferTime={300}
        maxBufferTime={1000}
        audioEnable={this.state.audioStatusTwo}
        autoplay
      />
    );
  };

  // renderLandscapeNodePlayerView = (inputUrl) => {
  //   const { audioStatus } = this.props;
  //   if (!inputUrl) return null;
  //   return (
  //     <NodePlayerView
  //       style={styles.streamOneLandscape}
  //       ref={(vb) => {
  //         this.nodePlayerView = vb;
  //       }}
  //       inputUrl={inputUrl}
  //       scaleMode="ScaleAspectFit"
  //       bufferTime={300}
  //       maxBufferTime={1000}
  //       // audioEnable={audioStatus}
  //       autoplay
  //     />
  //   );
  // };

  onPressClose = () => {
    const { navigation } = this.props;
    navigation.goBack();
  };

  onPressMaximizeStreamOne = () => {
    const {
      navigation: { push },
    } = this.props;

    const { streamCardsFull } = this.state;

    let data = {};
    for (let i = 0; i < streamCardsFull.length; i++) {
      if (streamCardsFull[i].roomName === this.state.streamOneName) {
        data = streamCardsFull[i];
      }
    }

    const userName = this.viewerName;

    push('Viewer', { userName, data });
  };

  onPressMaximizeStreamTwo = () => {
    const {
      navigation: { push },
    } = this.props;

    const { streamCardsFull } = this.state;

    let data = {};
    for (let i = 0; i < streamCardsFull.length; i++) {
      if (streamCardsFull[i].roomName === this.state.streamTwoName) {
        data = streamCardsFull[i];
      }
    }

    const userName = this.viewerName;

    push('Viewer', { userName, data });
  };

  onPressAudioOne = () => {
    const { audioStatusOne } = this.state;
    if (audioStatusOne) {
      this.setState({ audioStatusOne: false });
      this.setState({ audioIconOne: require('../../assets/ico_soundoff.png') });
    } else {
      this.setState({ audioStatusOne: true });
      this.setState({ audioIconOne: require('../../assets/ico_soundon.png') });
    }
  };

  onPressAudioTwo = () => {
    const { audioStatusTwo } = this.state;
    if (audioStatusTwo) {
      this.setState({ audioStatusTwo: false });
      this.setState({ audioIconTwo: require('../../assets/ico_soundoff.png') });
    } else {
      this.setState({ audioStatusTwo: true });
      this.setState({ audioIconTwo: require('../../assets/ico_soundon.png') });
    }
  };

  render() {
    const { streamTwoHandler } = this;
    const { streamOneHandler } = this;
    const { streamCards } = this.state;

    // if (this.state.orientation === 'portrait') {
    //   const { streamCards } = this.state;
    //   console.log('stream cards:', streamCards);

    // For testing lazy loading
    // const testroomName = '345';
    // const  testStreamCards = [{"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName},  {"roomName": testroomName}, {"roomName": testroomName},
    // {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName},  {"roomName": testroomName}, {"roomName": testroomName},
    // {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName},  {"roomName": testroomName}, {"roomName": testroomName},
    // {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName},  {"roomName": testroomName}, {"roomName": testroomName},
    // {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName}, {"roomName": testroomName},  {"roomName": testroomName}, {"roomName": testroomName},
    // ]

    const { audioIconOne } = this.state;
    const { audioIconTwo } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>시청중인 라이브</Text>
          <TouchableOpacity style={styles.btnClose} onPress={this.onPressClose}>
            <Image source={require('../../assets/ico_goback.png')} />
          </TouchableOpacity>
        </View>
        <View style={styles.streamContainerPortrait}>
          <View style={styles.streamOnePortraitBackground}>
            <ImageBackground
              source={require('../../assets/logoBW_icon.png')}
              style={styles.streamCardBackground}
            >
              <View style={{ opacity: this.state.opacityOne }}>
                <Image source={require(`../../assets/ico_live.png`)} style={styles.onLiveIcon} />
                <TouchableOpacity
                  style={styles.buttonMaximize}
                  onPress={this.onPressMaximizeStreamOne}
                >
                  <Image
                    source={require('../../assets/ico_maximize.png')}
                    style={styles.icoMaximize}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAudio} onPress={this.onPressAudioOne}>
                  <Image style={styles.icoAudio} source={audioIconOne} />
                </TouchableOpacity>
                {this.renderPortraitNodePlayerViewOne(this.state.inputUrlFirst)}
                <Image source={require('../../assets/001.png')} style={styles.bannerOne} />
              </View>
            </ImageBackground>
          </View>
          <View style={styles.streamTwoPortraitBackground}>
            <ImageBackground
              source={require('../../assets/logoBW_icon.png')}
              style={styles.streamCardBackground}
            >
              <View style={{ opacity: this.state.opacityTwo }}>
                <Image source={require(`../../assets/ico_live.png`)} style={styles.onLiveIcon} />
                <TouchableOpacity
                  style={styles.buttonMaximize}
                  onPress={this.onPressMaximizeStreamTwo}
                >
                  <Image
                    source={require('../../assets/ico_maximize.png')}
                    style={styles.icoMaximize}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAudio} onPress={this.onPressAudioTwo}>
                  <Image style={styles.icoAudio} source={audioIconTwo} />
                </TouchableOpacity>
                {this.renderPortraitNodePlayerViewTwo(this.state.inputUrlSecond)}
                <Image source={require('../../assets/002.png')} style={styles.bannerOne} />
              </View>
            </ImageBackground>
          </View>
        </View>
        <View style={styles.cardsHeader}>
          <View
            style={{
              borderBottomColor: 'rgba(255, 255, 255, 0.2)',
              borderBottomWidth: 0.5,
              marginTop: 90,
            }}
          />
          <Text style={styles.cardsHeaderText}>진행중인 다른 라이브</Text>
        </View>
        <FlatList
          style={styles.flatList}
          showsHorizontalScrollIndicator={false}
          horizontal
          ref={(ref) => {
            this.flatListRef = ref;
          }}
          onScroll={(e) => {
            this.scrollOffset = e.nativeEvent.contentOffset.x;
          }}
          data={streamCards}
          renderItem={({ item }) => (
            <StreamCard
              data={item}
              streamTwoHandler={streamTwoHandler.bind(this)}
              streamOneHandler={streamOneHandler.bind(this)}
            />
          )}
          keyExtractor={(item) => item._id}
        />
        <View style={styles.cardsContainer}></View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>위로 드래그 해서 시청하세요</Text>
          <TouchableOpacity
            style={styles.buttonLeft}
            onPress={() => {
              this.flatListRef.scrollToOffset({
                animated: true,
                offset: this.scrollOffset - 134,
              });
            }}
          >
            <Image style={styles.icoLeft} source={require('../../assets/left-arrow.png')} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonRight}
            onPress={() => {
              this.flatListRef.scrollToOffset({
                animated: true,
                offset: this.scrollOffset + 134,
              });
            }}
          >
            <Image style={styles.icoRight} source={require('../../assets/right-arrow.png')} />
          </TouchableOpacity>
        </View>
        {/* </ImageBackground> */}
      </View>
    );
    // }
    // else {
    //   return (
    //     <View style={styles.container}>
    //       <TouchableOpacity style={styles.btnClose} onPress={this.onPressClose}>
    //         <Image
    //           style={styles.icoClose}
    //           source={require('../../assets/ico_goback.png')}
    //           tintColor="white"
    //         />
    //       </TouchableOpacity>
    //       <View style={styles.streamContainerLandscape}>
    //         <View style={styles.streamOneLandscapeBackground}>
    //           {this.renderLandscapeNodePlayerView(this.state.inputUrlFirst)}
    //         </View>
    //         <View style={styles.streamTwoLandscapeBackground}>
    //           {this.renderLandscapeNodePlayerView(this.state.inputUrlSecond)}
    //         </View>
    //       </View>
    //     </View>
    //   );
    // }
  }
}

export default Comparison;
