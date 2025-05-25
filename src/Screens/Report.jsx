// screens/PDFViewer.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const PDFViewer = ({ route }) => {
  const { uri } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        startInLoadingState
      />
    </View>
  );
};

export default PDFViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
