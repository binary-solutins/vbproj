import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const {width, height} = Dimensions.get('window');

const SelectionSection = ({
  doctors,
  patients = [],
  selectedDoctor,
  selectedPatient,
  setSelectedDoctor,
  setSelectedPatient,
}) => {
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [searchPatientQuery, setSearchPatientQuery] = useState('');

  // Improved doctor filtering logic with useMemo for performance
  const filteredDoctors = useMemo(() => {
    if (!doctors || !Array.isArray(doctors)) return [];

    if (!searchDoctorQuery.trim()) return doctors;

    const query = searchDoctorQuery.toLowerCase().trim();

    return doctors.filter(doctor => {
      if (!doctor) return false;

      const name = doctor.name?.toLowerCase() || '';
      const specialization = doctor.specialization?.toLowerCase() || '';

      return name.includes(query) || specialization.includes(query);
    });
  }, [doctors, searchDoctorQuery]);

  console.log(' patients IMP==========> ', patients);

  // Improved patient filtering logic with useMemo for performance
  const filteredPatients = useMemo(() => {
    if (!patients) return [];

    // Handle both array format and object with patients property
    const patientArray = Array.isArray(patients) ? patients : patients.patients;

    if (!patientArray || !Array.isArray(patientArray)) return [];

    if (!searchPatientQuery.trim()) return patientArray;

    const query = searchPatientQuery.toLowerCase().trim();

    return patientArray.filter(patient => {
      if (!patient) return false;

      const firstName = patient.firstName?.toLowerCase() || '';
      const lastName = patient.lastName?.toLowerCase() || '';

      return firstName.includes(query) || lastName.includes(query);
    });
  }, [patients, searchPatientQuery]);

  // Helper function to get patient display name
  const getPatientDisplayName = patient => {
    if (!patient) return '';
    const firstName = patient.firstName || '';
    const lastName = patient.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  const renderDoctorDropdown = () => (
    <Modal
      visible={showDoctorDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDoctorDropdown(false)}>
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowDoctorDropdown(false)}>
        <View
          style={styles.dropdownContainer}
          onStartShouldSetResponder={() => true}>
          <Text style={styles.dropdownTitle}>Select Doctor</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors..."
            value={searchDoctorQuery}
            onChangeText={setSearchDoctorQuery}
            placeholderTextColor="#9CA3AF"
          />
          <FlatList
            data={filteredDoctors}
            keyExtractor={item =>
              item?.id?.toString() || Math.random().toString()
            }
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedDoctor?.id === item.id && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedDoctor(item);
                  setShowDoctorDropdown(false);
                }}>
                <Text style={styles.doctorName}>{item.name}</Text>
                <Text style={styles.doctorSpecialization}>
                  {item.specialization}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyMessage}>
                <Text style={styles.emptyText}>No doctors found</Text>
              </View>
            }
            contentContainerStyle={styles.dropdownList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPatientDropdown = () => (
    <Modal
      visible={showPatientDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPatientDropdown(false)}>
      <TouchableOpacity
        style={styles.dropdownOverlay}
        activeOpacity={1}
        onPress={() => setShowPatientDropdown(false)}>
        <View
          style={styles.dropdownContainer}
          onStartShouldSetResponder={() => true}>
          <Text style={styles.dropdownTitle}>Select Patient</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchPatientQuery}
            onChangeText={setSearchPatientQuery}
            placeholderTextColor="#9CA3AF"
          />
          <FlatList
            data={filteredPatients}
            keyExtractor={item =>
              item?.id?.toString() || Math.random().toString()
            }
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedPatient?.id === item.id &&
                    styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setSelectedPatient(item);
                  setShowPatientDropdown(false);
                }}>
                <Text style={styles.patientName}>
                  {getPatientDisplayName(item)}
                </Text>
                {item.age && (
                  <Text style={styles.patientAge}>Age: {item.age}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyMessage}>
                <Text style={styles.emptyText}>No patients found</Text>
              </View>
            }
            contentContainerStyle={styles.dropdownList}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Select Doctor & Patient</Text>

      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => {
          setShowDoctorDropdown(true);
          setSearchDoctorQuery('');
        }}>
        <View style={styles.selectionContent}>
          <Feather
            name="user-check"
            size={20}
            color="#6B7280"
            style={styles.selectionIcon}
          />
          <Text style={styles.selectionLabel}>
            {selectedDoctor ? selectedDoctor.name : 'Select Doctor'}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selectionButton}
        onPress={() => {
          setShowPatientDropdown(true);
          setSearchPatientQuery('');
        }}>
        <View style={styles.selectionContent}>
          <Feather
            name="user"
            size={20}
            color="#6B7280"
            style={styles.selectionIcon}
          />
          <Text style={styles.selectionLabel}>
            {selectedPatient
              ? getPatientDisplayName(selectedPatient) || 'Selected Patient'
              : 'Select Patient'}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {renderDoctorDropdown()}
      {renderPatientDropdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionIcon: {
    marginRight: 12,
  },
  selectionLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    height: 40,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 10,
    fontSize: 14,
    color: '#374151',
  },
  dropdownList: {
    paddingVertical: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  doctorSpecialization: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  patientAge: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyMessage: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default SelectionSection;
