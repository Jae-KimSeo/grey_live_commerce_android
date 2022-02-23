import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  AppRegistry,
  Animated,
  Alert,
  PanResponder,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import get from 'lodash/get';
import { NodePlayerView } from 'react-native-nodemediaclient';
import moment from 'moment';
import { getLinkPreview } from 'link-preview-js';
import Draggable from 'react-native-draggable';
import Icon from 'react-native-vector-icons/Entypo';
import BannerButton from './BannerButton';
import SocketManager from '../../socketManager';
import styles from './styles';
import FloatingHearts from '../../components/FloatingHearts';
import ChatInputGroup from '../../components/ChatInputGroup';
import MessagesList from '../../components/MessagesList/MessagesList';
import { LIVE_STATUS } from '../../utils/constants';
import { HTTP } from '../../config';
import Home from '../Home/index';

export default class Viewer extends Component {
  constructor(props) {
    super(props);
    const { route } = props;
    // route로 넘어오는 정보: { userName, roomName: userName, enteredRoomName, enteredProductLink });
    const data = get(route, 'params.data');
    const roomName = get(data, 'roomName');
    const liveStatus = get(data, 'liveStatus', LIVE_STATUS.PREPARE);
    const userName = get(route, 'params.userName', '');
    const goodsUrl = get(data, 'productLink');
    const countViewer = get(data, 'countViewer');
    this.state = {
      messages: [],
      countHeart: 0,
      isVisibleMessages: true,
      inputUrl: null,
      dragging: false,
      isUri: false,
      linkTitle: undefined,
      linkDesc: undefined,
      linkFavicon: undefined,
      linkImg: undefined,
      requestOptions: {},
      isVisibleFooter: true,
      audioStatus: true,
      audioIcon: require('../../assets/ico_soundon.png'),
      roomName,
      userName,
    };
    this.roomName = roomName;
    this.userName = userName;
    this.goodsUrl = goodsUrl;
    this.liveStatus = liveStatus;
    this.timeout = null;
    const { requestOptions } = this.state;
    this.getPreview(goodsUrl, requestOptions);
    this.countViewer = countViewer;
  }

  componentWillMount() {
    const { dragging } = this.state;
    this._y = 0;
    this._animation = new Animated.Value(0);
    this._animation.addListener(({ value }) => {
      this._y = value;
    });
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => {
        if (dragging) return false;
        return true;
      },
      onPanResponderMove: this.onResponderMove,
      onPanResponderRelease: this.onResponderEnd,
    });
  }

  onResponderMove = () => {
    const { dragging } = this.state;
    if (!dragging) {
      Animated.event([null, { dy: this._animation }], { useNativeDriver: true });
    }
  };

  onResponderEnd = (e, gestureState) => {
    const { dragging } = this.state;
    if (gestureState.dy > 100) {
      Animated.timing(this._animation, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
      this._animation.setOffset(100);
      // this.state.dragging = true;
      this.setState({
        dragging: true,
      });
    } else if (!dragging) {
      this._animation.setOffset(0);
      Animated.timing(this._animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  handleOpen = () => {
    this._animation.setOffset(0);
    Animated.timing(this._animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  componentDidMount() {
    const { navigation } = this.props;
    /**
     * Just for replay
     */
    if (this.liveStatus === LIVE_STATUS.FINISH) {
      SocketManager.instance.emitReplay({
        userName: this.userName,
        roomName: this.roomName,
      });
      SocketManager.instance.listenReplay((data) => {
        const { beginAt, messages } = data;
        const start = moment(beginAt);
        for (let i = 0; i < messages.length; i += 1) {
          ((j, that) => {
            const end = moment(messages[j].createdAt);
            const duration = end.diff(start);
            setTimeout(() => {
              that.setState((prevState) => ({ messages: [...prevState.messages, messages[j]] }));
            }, duration);
          })(i, this);
        }
      });
      const inputUrl = `${HTTP}/live/${this.roomName}/replayFor${this.userName}`;
      this.setState({ inputUrl });
    } else {
      this.setState({
        inputUrl: `${HTTP}/live/${this.roomName}.flv`,
        // use HLS from trasporting in media server to Viewer
        messages: this.messages,
      });
      SocketManager.instance.emitJoinRoom({
        userName: this.userName,
        roomName: this.roomName,
      });
      SocketManager.instance.listenSendHeart(() => {
        this.setState((prevState) => ({ countHeart: prevState.countHeart + 1 }));
      });
      SocketManager.instance.listenSendMessage((data) => {
        const messages = get(data, 'messages', []);
        this.setState({ messages });
      });
      SocketManager.instance.listenFinishLiveStream(() => {
        Alert.alert(
          'Alert ',
          'Thanks for watching this live stream',
          [
            {
              text: 'Okay',
              onPress: () => navigation.goBack(),
            },
          ],
          { cancelable: false }
        );
      });
    }

    /*
    seriezable animation
    */
  }

  componentWillUnmount() {
    if (this.nodePlayerView) this.nodePlayerView.stop();
    SocketManager.instance.emitLeaveRoom({
      userName: this.userName,
      roomName: this.roomName,
    });
    this.setState({
      messages: [],
      countHeart: 0,
      isVisibleMessages: true,
      inputUrl: null,
    });
    clearTimeout(this.timeout);
  }

  startBackgroundAnimation = () => {
    this.Animation.setValue(0);
    Animated.timing(this.Animation, {
      toValue: 1,
      duration: 15000,
      useNativeDriver: false,
    }).start(() => {
      this.startBackgroundAnimation();
    });
  };

  getPreview = (text, options) => {
    const { onError, onLoad } = this.props;
    getLinkPreview(text, options)
      .then((data) => {
        onLoad(data);
        this.setState({
          isUri: true,
          linkTitle: data.title ? data.title : undefined,
          linkDesc: data.description ? data.description : undefined,
          linkImg:
            data.images && data.images.length > 0
              ? data.images.find((element) => {
                  return (
                    element.includes('.png') ||
                    element.includes('.jpg') ||
                    element.includes('.jpeg')
                  );
                })
              : undefined,
          linkFavicon:
            data.favicons && data.favicons.length > 0
              ? data.favicons[data.favicons.length - 1]
              : undefined,
        });
      })
      .catch((error) => {
        onError(error);
        this.setState({ isUri: false });
      });
  };

  onPressHeart = () => {
    SocketManager.instance.emitSendHeart({
      roomName: this.roomName,
    });
  };

  onPressSend = (message) => {
    SocketManager.instance.emitSendMessage({
      roomName: this.roomName,
      userName: this.userName,
      message,
    });
    this.setState({ isVisibleMessages: true });
  };

  onEndEditing = () => this.setState({ isVisibleMessages: true });

  onFocusChatGroup = () => {
    this.setState({ isVisibleMessages: false });
  };

  onPressClose = () => {
    const { navigation } = this.props;
    navigation.goBack();
  };

  onPressLinkButton = () => {
    const { isUri, linkImg, linkFavicon, linkTitle, linkDesc } = this.state;
    const { isVisibleFooter } = this.state;
    if (isVisibleFooter) {
      return (
        <BannerButton
          isUri={isUri}
          goodsUrl={this.goodsUrl}
          linkImg={linkImg}
          linkFavicon={linkFavicon}
          linkTitle={linkTitle}
          linkDesc={linkDesc}
        />
      );
    }
  };

  onPressVisible = () => {
    const { isVisibleFooter } = this.state;
    this.setState(() => ({ isVisibleFooter: !isVisibleFooter }));
  };

  onPressCompare = () => {
    const { roomName, userName, audioStatus } = this.state;
    const {
      navigation: { navigate },
    } = this.props;
    navigate('Comparison', { roomName, userName, audioStatus });
  };

  onPressSound = () => {
    const { audioStatus } = this.state;
    if (audioStatus) {
      this.state.audioStatus = false;
      this.setState({ audioIcon: require('../../assets/ico_soundoff.png') });
    } else {
      this.state.audioStatus = true;
      this.setState({ audioIcon: require('../../assets/ico_soundon.png') });
    }
  };

  renderBackgroundColors = () => {
    const backgroundColor = this.Animation.interpolate({
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
      outputRange: ['#1abc9c', '#3498db', '#9b59b6', '#34495e', '#f1c40f', '#1abc9c'],
    });
    if (this.liveStatus === LIVE_STATUS.FINISH) return null;
    return (
      <Animated.View style={[styles.backgroundContainer, { backgroundColor }]}>
        <SafeAreaView style={styles.wrapperCenterTitle}>
          <Text style={styles.titleText}>
            Stay here and wait until start live stream you will get 30% discount
          </Text>
        </SafeAreaView>
      </Animated.View>
    );
  };

  renderNodePlayerView = () => {
    const { audioStatus } = this.state;
    const { inputUrl } = this.state;
    if (!inputUrl) return null;
    return (
      <NodePlayerView
        style={styles.playerView}
        ref={(vb) => {
          this.nodePlayerView = vb;
        }}
        inputUrl={inputUrl}
        scaleMode="ScaleAspectFit"
        bufferTime={300}
        maxBufferTime={1000}
        audioEnable={audioStatus}
        autoplay
      />
    );
  };

  renderChatGroup = () => {
    const { dragging } = this.state;
    if (!dragging) {
      return (
        <ChatInputGroup
          onPressHeart={this.onPressHeart}
          onPressSend={this.onPressSend}
          onFocus={this.onFocusChatGroup}
          onEndEditing={this.onEndEditing}
        />
      );
    }
  };

  renderListMessages = () => {
    const { dragging } = this.state;
    const { messages, isVisibleMessages } = this.state;
    if (!dragging) {
      if (!isVisibleMessages) return null;
      return <MessagesList messages={messages} />;
    }
  };

  renderTransParencyObject = () => {
    const { dragging } = this.state;
    const { audioIcon } = this.state;
    return (
      <View>
        <TouchableOpacity style={styles.btnClose} onPress={this.onPressClose}>
          <Image source={require('../../assets/ico_goback.png')} />
        </TouchableOpacity>
        <View>
          <TouchableOpacity style={styles.btnCompare} onPress={this.onPressCompare}>
            <Image source={require('../../assets/compare-icon.png')} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnSound} onPress={this.onPressSound}>
          <Image source={audioIcon} />
        </TouchableOpacity>
        {!dragging && (
          <View>
            <Text style={styles.roomName}>{this.roomName}</Text>
            <Image style={styles.viewerIcon} source={require('../../assets/ico_viewer.png')} />
            <Text style={styles.countViewer}>{this.countViewer}</Text>
          </View>
        )}
      </View>
    );
  };

  renderBottom = () => {
    const { dragging } = this.state;
    return (
      <View>
        {!dragging && (
          <View>
            <Text style={styles.roomName}>{this.roomName}</Text>
            <Image style={styles.viewerIcon} source={require('../../assets/ico_viewer.png')} />
            <Text style={styles.countViewer}>{this.countViewer}</Text>
          </View>
        )}
      </View>
    );
  };

  render() {
    const { countHeart } = this.state;

    const { width, height: screenHeight } = Dimensions.get('window');
    const videoHeight = width * 2.05555;
    const padding = 5;
    const yOutput = screenHeight - videoHeight + (videoHeight * 0.8) / 2 - padding;
    const xOutput = (width * 0.5) / 2 - padding;

    const translateYInterpolate = this._animation.interpolate({
      inputRange: [0, 300],
      outputRange: [0, yOutput],
      extrapolate: 'clamp',
    });

    const scaleInterpolate = this._animation.interpolate({
      inputRange: [0, 300],
      outputRange: [1, 0.3],
      extrapolate: 'clamp',
    });

    const translateXInterpolate = this._animation.interpolate({
      inputRange: [0, 300],
      outputRange: [0, xOutput],
      extrapolate: 'clamp',
    });

    const videoStyles = {
      transform: [
        {
          translateY: translateYInterpolate,
        },
        {
          translateX: translateXInterpolate,
        },
        {
          scale: scaleInterpolate,
        },
      ],
    };

    const { isVisibleFooter } = this.state;
    const { dragging } = this.state;
    const { navigation } = this.props;
    const { route } = this.props;
    /**
     * Replay mode
     */
    if (this.liveStatus === LIVE_STATUS.FINISH) {
      return (
        <View style={styles.blackContainer}>
          {this.renderNodePlayerView()}
          {this.renderListMessages()}
          <TouchableOpacity style={styles.btnClose} onPress={this.onPressClose}>
            <Image
              style={styles.icoClose}
              source={require('../../assets/close.png')}
              tintColor="white"
            />
          </TouchableOpacity>
          <FloatingHearts count={countHeart} />
        </View>
      );
    }

    /**
     * Viewer mode
     */
    return (
      <SafeAreaView style={styles.container}>
        <Home navigation={navigation} route={route} />
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Draggable renderColor="black" disabled={!dragging}>
            <Animated.View
              style={[{ width, height: videoHeight }, videoStyles]}
              {...this._panResponder.panHandlers}
            >
              {this.renderNodePlayerView()}
              <TouchableWithoutFeedback style={styles.contentWrapper} onPress={this.onPressVisible}>
                <View style={styles.footerBar}>
                  {isVisibleFooter && this.renderTransParencyObject()}
                  <View style={styles.head}>
                    {this.onPressLinkButton()}
                    {this.renderListMessages()}
                  </View>
                  {isVisibleFooter && <View style={styles.body}>{this.renderChatGroup()}</View>}
                </View>
              </TouchableWithoutFeedback>
              <FloatingHearts count={countHeart} />
            </Animated.View>
          </Draggable>
        </View>
      </SafeAreaView>
    );
  }
}

Viewer.propTypes = {
  requestOptions: PropTypes.shape({
    headers: PropTypes.objectOf(PropTypes.string),
    imagesPropertyType: PropTypes.string,
    proxyUrl: PropTypes.string,
  }),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }),

  route: PropTypes.shape({}),
};

Viewer.defaultProps = {
  onLoad: () => {},
  onError: () => {},
  requestOptions: {},
  navigation: {
    goBack: () => {},
  },
  route: {},
};

AppRegistry.registerComponent('Viewer', () => Viewer);
