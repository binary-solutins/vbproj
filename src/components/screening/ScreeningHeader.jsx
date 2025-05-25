import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  StatusBar, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const SCREEN_WIDTH = Dimensions.get('window').width;
const isIOS = Platform.OS === 'ios';
const STATUS_BAR_HEIGHT = isIOS ? 44 : StatusBar.currentHeight;

const ScreeningHeader = ({ navigation, title = "Breast Screening" }) => {
  return (
    <SafeAreaView style={{ backgroundColor: '#DB2777' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#DB2777"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => navigation.navigate('Information')}
          accessibilityLabel="Information"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Feather name="info" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DB2777',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 60,
    width: SCREEN_WIDTH,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
});

export default ScreeningHeader;