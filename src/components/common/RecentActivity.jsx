import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';


const RecentActivity = ({ reports, loading, error, onViewAll }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#db2777" />
        <Text style={styles.loadingText}>Loading recent activity...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={24} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load recent activity</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onViewAll}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recent activities to show</Text>
      </View>
    );
  }

 

  const handleViewReport = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {reports.map((report) => (
        <View key={report.id} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityIconContainer}>
              <Icon name="file-text" size={16} color="#fff" />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {report.title}
              </Text>
             
            </View>
          </View>
          
          <View style={styles.patientInfo}>
            <Text style={styles.patientLabel}>Patient:</Text>
            <Text style={styles.patientName}>{report.patientName}</Text>
          </View>
          
          <View style={styles.activityFooter}>
            <Text style={styles.reportType}>
              {report.reportType || 'Medical Report'}
            </Text>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => handleViewReport(report.fileUrl)}
            >
              <Text style={styles.viewButtonText}>View Report</Text>
              <Icon name="external-link" size={14} color="#db2777" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
  },
  retryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#9ca3af',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#db2777',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1f2937',
  },
  activityTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  patientLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6b7280',
    marginRight: 4,
  },
  patientName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1f2937',
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  reportType: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#db2777',
  },
});

export default RecentActivity;