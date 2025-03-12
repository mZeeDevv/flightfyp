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
});

const FlightInvoicePDF = ({ flightDetails, transactionId, paymentMethod, userData, amount }) => (
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
      </View>

      {/* Flight Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flight Details</Text>
        <View style={styles.sectionLine} /> {/* Line below section title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Departure Airport:</Text>
          <Text style={styles.fieldValue}>
            {flightDetails?.segments?.[0]?.departureAirport?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Arrival Airport:</Text>
          <Text style={styles.fieldValue}>
            {flightDetails?.segments?.[0]?.arrivalAirport?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Departure Time:</Text>
          <Text style={styles.fieldValue}>
            {flightDetails?.segments?.[0]?.departureTime || 'N/A'}
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Arrival Time:</Text>
          <Text style={styles.fieldValue}>
            {flightDetails?.segments?.[0]?.arrivalTime || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} /> {/* Line above footer */}
        <Text>Thank you for using JeetSeeker! We hope to see you again soon.</Text>
      </View>
    </Page>
  </Document>
);

export default FlightInvoicePDF;