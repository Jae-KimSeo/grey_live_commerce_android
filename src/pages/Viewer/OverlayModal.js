import React, { Component } from 'react';
import {View, StyleSheet, Text, TextInput, TouchableOpacity} from 'react-native';
import styles from './styles';
import { RTMP_SERVER } from '../../config';
import test_image from '../../assets/gopher.png'
import {Image} from 'react-native'

export default class OverlayModal extends Component {
  constructor(props) {
    super(props)
  };

  render() {
    const show = this.props.show;
    if (show){
      return (
        <View  style={styles.Modalcontainer}>
          <Image source={test_image} style={styles.PIP}/>
       </View>
      );
    }
    else {
      return (
        <View style={styles.Modalcontainer}>
        </View>
      );
    }
  }
}
