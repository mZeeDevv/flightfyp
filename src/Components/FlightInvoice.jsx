import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#2C3E50',
    marginTop: 10,
    marginBottom: 10,
  },
  invoiceTitle: {
    fontSize: 18,
    marginTop: 10,
    color: '#34495E',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  sectionLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#BDC3C7',
    marginBottom: 10,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34495E',
  },
  fieldValue: {
    fontSize: 12,
    color: '#2C3E50',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#7F8C8D',
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: '#BDC3C7',
    marginTop: 10,
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#3498DB',
    color: 'white',
    padding: 5,
    borderRadius: 10,
    fontSize: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  }
});

const FlightInvoicePDF = ({ flightDetails, transactionId, paymentMethod, userData, amount }) => {
  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return 'N/A';
    }
  };
  
  // Calculate duration between departure and arrival
  const calculateDuration = (departureTime, arrivalTime) => {
    if (!departureTime || !arrivalTime) return 'N/A';
    
    try {
      const depTime = new Date(departureTime).getTime();
      const arrTime = new Date(arrivalTime).getTime();
      const durationMinutes = (arrTime - depTime) / (1000 * 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = Math.round(durationMinutes % 60);
      return `${hours}h ${minutes}m`;
    } catch(e) {
      return 'N/A';
    }
  };
  
  const isRoundTrip = flightDetails?.tripType === 'ROUNDTRIP' && flightDetails.segments?.length > 1;
  
  return (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>JeetSeeker</Text>
          <View style={styles.headerLine} /> {/* Line below company name */}
          <Text style={styles.invoiceTitle}>Flight Booking Invoice</Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.sectionLine} /> {/* Line below section title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Transaction ID:</Text>
            <Text style={styles.fieldValue}>{transactionId}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer Name:</Text>
            <Text style={styles.fieldValue}>{userData?.name}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount Paid:</Text>
            <Text style={styles.fieldValue}>RS. {amount}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Payment Method:</Text>
            <Text style={styles.fieldValue}>{paymentMethod}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Booking Date:</Text>
            <Text style={styles.fieldValue}>{new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Trip Type:</Text>
            <Text style={styles.fieldValue}>{isRoundTrip ? 'Round Trip' : 'One Way'}</Text>
          </View>
        </View>

        {/* Outbound Flight Details */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Text style={styles.sectionTitle}>Outbound Flight Details</Text>
            <View style={styles.badge}>
              <Text>DEPARTURE</Text>
            </View>
          </View>
          <View style={styles.sectionLine} /> {/* Line below section title */}
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Flight Number:</Text>
            <Text style={styles.fieldValue}>
              {flightDetails?.segments?.[0]?.legs?.[0]?.flightNumber || 
               flightDetails?.segments?.[0]?.legs?.[0]?.flightInfo?.flightNumber || 'N/A'}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Airline:</Text>
            <Text style={styles.fieldValue}>
              {flightDetails?.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.name || 'N/A'}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Departure Airport:</Text>
            <Text style={styles.fieldValue}>
              {flightDetails?.segments?.[0]?.departureAirport?.name || 'N/A'} 
              ({flightDetails?.segments?.[0]?.departureAirport?.code || 'N/A'})
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Arrival Airport:</Text>
            <Text style={styles.fieldValue}>
              {flightDetails?.segments?.[0]?.arrivalAirport?.name || 'N/A'} 
              ({flightDetails?.segments?.[0]?.arrivalAirport?.code || 'N/A'})
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Departure Time:</Text>
            <Text style={styles.fieldValue}>
              {formatDateTime(flightDetails?.segments?.[0]?.departureTime)}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Arrival Time:</Text>
            <Text style={styles.fieldValue}>
              {formatDateTime(flightDetails?.segments?.[0]?.arrivalTime)}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Duration:</Text>
            <Text style={styles.fieldValue}>
              {calculateDuration(
                flightDetails?.segments?.[0]?.departureTime, 
                flightDetails?.segments?.[0]?.arrivalTime
              )}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cabin Class:</Text>
            <Text style={styles.fieldValue}>
              {flightDetails?.segments?.[0]?.legs?.[0]?.cabinClass || 'Economy'}
            </Text>
          </View>
        </View>

        {/* Return Flight Details (only for round trips) */}
        {isRoundTrip && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <Text style={styles.sectionTitle}>Return Flight Details</Text>
              <View style={styles.badge}>
                <Text>RETURN</Text>
              </View>
            </View>
            <View style={styles.sectionLine} /> {/* Line below section title */}
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Flight Number:</Text>
              <Text style={styles.fieldValue}>
                {flightDetails?.segments?.[1]?.legs?.[0]?.flightNumber || 
                 flightDetails?.segments?.[1]?.legs?.[0]?.flightInfo?.flightNumber || 'N/A'}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Airline:</Text>
              <Text style={styles.fieldValue}>
                {flightDetails?.segments?.[1]?.legs?.[0]?.carriersData?.[0]?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Departure Airport:</Text>
              <Text style={styles.fieldValue}>
                {flightDetails?.segments?.[1]?.departureAirport?.name || 'N/A'} 
                ({flightDetails?.segments?.[1]?.departureAirport?.code || 'N/A'})
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Arrival Airport:</Text>
              <Text style={styles.fieldValue}>
                {flightDetails?.segments?.[1]?.arrivalAirport?.name || 'N/A'} 
                ({flightDetails?.segments?.[1]?.arrivalAirport?.code || 'N/A'})
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Departure Time:</Text>
              <Text style={styles.fieldValue}>
                {formatDateTime(flightDetails?.segments?.[1]?.departureTime)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Arrival Time:</Text>
              <Text style={styles.fieldValue}>
                {formatDateTime(flightDetails?.segments?.[1]?.arrivalTime)}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Duration:</Text>
              <Text style={styles.fieldValue}>
                {calculateDuration(
                  flightDetails?.segments?.[1]?.departureTime, 
                  flightDetails?.segments?.[1]?.arrivalTime
                )}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Cabin Class:</Text>
              <Text style={styles.fieldValue}>
                {flightDetails?.segments?.[1]?.legs?.[0]?.cabinClass || 'Economy'}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} /> {/* Line above footer */}
          <Text>Thank you for using JeetSeeker! We hope to see you again soon.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default FlightInvoicePDF;